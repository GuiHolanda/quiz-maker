import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// Matches EditalExtractorService.MAX_FILE_SIZE — same document, same limit, whichever way it
// reached the server (manual upload vs. server-side download here).
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 30_000;
const PDF_MAGIC = '%PDF-';

// Browser-like headers so government and banca portals don't return 403/challenge pages.
// The Accept header lists PDF first, then octet-stream, then wildcard, so intermediary
// proxies that inspect it still pass the request to the real download handler.
const BROWSER_FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true; // malformed → unsafe
  const [a, b] = parts;

  if (a === 0) return true; // "this network"
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === '::1' || normalized === '::') return true; // loopback / unspecified
  if (/^fe[89ab][0-9a-f]:/.test(normalized)) return true; // fe80::/10 link-local
  if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // fc00::/7 unique local

  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mapped) return isPrivateIPv4(mapped[1]);

  return false;
}

function isPrivateIP(ip: string): boolean {
  const version = isIP(ip);

  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // couldn't classify → treat as unsafe
}

// SSRF guard: this is the first place the server fetches a URL an LLM handed it, so every
// resolved address — not just the hostname string — must be checked. DNS rebinding between
// the check and the actual fetch is an accepted residual risk here: the target is a Brazilian
// government/banca domain the LLM already vetted, not user-supplied input, and Node's fetch
// doesn't expose a way to pin the resolved address for the follow-up request.
async function assertPublicHost(hostname: string): Promise<void> {
  const addresses = await lookup(hostname, { all: true }).catch(() => []);

  if (addresses.length === 0) {
    throw Object.assign(new Error(`Could not resolve host: ${hostname}`), { status: 502 });
  }
  for (const { address } of addresses) {
    if (isPrivateIP(address)) {
      throw Object.assign(new Error(`Refusing to fetch edital from a private address: ${hostname}`), {
        status: 400,
      });
    }
  }
}

// Downloads a PDF from a URL the locate-edital step found, with the SSRF/size/type guards a
// server-initiated fetch of an LLM-sourced URL needs. Throws on any problem — the caller
// (runAutoConfigJob) treats that as "no PDF" and falls back to the research/review/format
// text pipeline, never as a reason to fail the whole job.
export async function fetchEditalPdf(url: string): Promise<File> {
  let currentUrl = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl);

    if (parsed.protocol !== 'https:') {
      throw Object.assign(new Error('Only https URLs are allowed'), { status: 400 });
    }
    await assertPublicHost(parsed.hostname);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      // redirect: 'manual' — the whole point is to re-validate the host of every hop before
      // following it, which fetch's own automatic redirect handling would skip.
      response = await fetch(parsed.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: BROWSER_FETCH_HEADERS,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');

      if (!location) {
        throw Object.assign(new Error('Redirect response missing Location header'), { status: 502 });
      }
      currentUrl = new URL(location, parsed).toString();
      continue;
    }

    if (!response.ok) {
      throw Object.assign(new Error(`Edital fetch failed with status ${response.status}`), { status: 502 });
    }

    // Skip the content-type check — many government and banca portals serve PDFs as
    // text/html or application/octet-stream. The %PDF- magic-byte check below is the
    // authoritative gatekeeper; a content-type mismatch alone is not a rejection reason.

    const declaredLength = Number(response.headers.get('content-length') ?? '0');
    if (declaredLength > MAX_PDF_BYTES) {
      throw Object.assign(new Error('Edital PDF exceeds the 20MB size limit'), { status: 413 });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw Object.assign(new Error('Edital response has no body'), { status: 502 });
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    for (;;) {
      const { done, value } = await reader.read();

      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PDF_BYTES) {
        await reader.cancel().catch(() => {});
        throw Object.assign(new Error('Edital PDF exceeds the 20MB size limit'), { status: 413 });
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    // Trust the magic bytes over the header — many government/banca portals serve the file
    // as application/octet-stream, and a header alone is too easy to get wrong either way.
    const magic = Buffer.from(bytes.slice(0, PDF_MAGIC.length)).toString('latin1');
    if (magic !== PDF_MAGIC) {
      throw Object.assign(new Error('Downloaded file is not a PDF'), { status: 502 });
    }

    return new File([bytes], 'edital.pdf', { type: 'application/pdf' });
  }

  throw Object.assign(new Error('Too many redirects while fetching the edital PDF'), { status: 502 });
}
