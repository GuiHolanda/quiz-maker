import { vi, describe, it, expect, beforeEach } from 'vitest';

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }));

vi.mock('node:dns/promises', () => ({
  lookup: lookupMock,
}));

import { fetchEditalPdf } from '@/lib/edital-fetch';

function chunksOf(bytes: Uint8Array, chunkSize = 4096): Uint8Array[] {
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < bytes.length; i += chunkSize) chunks.push(bytes.slice(i, i + chunkSize));

  return chunks;
}

// Minimal fetch Response stand-in — the module only touches .status, .ok, .headers.get and
// .body.getReader(), so a real Response (which needs a real ReadableStream source) isn't
// necessary and would make chunking/redirect control harder to script per test.
function fakeResponse(opts: {
  readonly status: number;
  readonly headers?: Record<string, string>;
  readonly body?: Uint8Array;
}) {
  const headers = new Map(Object.entries(opts.headers ?? {}));
  const chunks = opts.body ? chunksOf(opts.body) : [];
  let index = 0;

  return {
    status: opts.status,
    ok: opts.status >= 200 && opts.status < 300,
    headers: { get: (key: string) => headers.get(key.toLowerCase()) ?? null },
    body: {
      getReader: () => ({
        read: async () => {
          if (index >= chunks.length) return { done: true, value: undefined };
          const value = chunks[index];

          index += 1;
          return { done: false, value };
        },
        cancel: async () => {},
      }),
    },
  };
}

const PDF_BYTES = new TextEncoder().encode('%PDF-1.7\n%fake edital content%%EOF');

beforeEach(() => {
  vi.restoreAllMocks();
  lookupMock.mockReset();
  // Public IP by default — individual tests override for the private-address cases.
  lookupMock.mockResolvedValue([{ address: '203.0.113.10', family: 4 }]);
});

describe('fetchEditalPdf', () => {
  it('rejects non-https URLs before touching the network', async () => {
    await expect(fetchEditalPdf('http://example.gov.br/edital.pdf')).rejects.toMatchObject({ status: 400 });
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('rejects a host that resolves to a private/loopback address (SSRF guard)', async () => {
    lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(fetchEditalPdf('https://internal.example.com/edital.pdf')).rejects.toMatchObject({ status: 400 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a host that resolves to the cloud metadata address', async () => {
    lookupMock.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);

    await expect(fetchEditalPdf('https://internal.example.com/edital.pdf')).rejects.toMatchObject({ status: 400 });
  });

  it('rejects when one of several resolved addresses is private', async () => {
    lookupMock.mockResolvedValue([
      { address: '203.0.113.10', family: 4 },
      { address: '10.0.0.5', family: 4 },
    ]);

    await expect(fetchEditalPdf('https://mixed.example.com/edital.pdf')).rejects.toMatchObject({ status: 400 });
  });

  it('rejects an unresolvable host', async () => {
    lookupMock.mockResolvedValue([]);

    await expect(fetchEditalPdf('https://nowhere.example.com/edital.pdf')).rejects.toMatchObject({ status: 502 });
  });

  it('rejects an unexpected content-type', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeResponse({ status: 200, headers: { 'content-type': 'text/html' }, body: PDF_BYTES }) as any
    );

    await expect(fetchEditalPdf('https://www.trf1.jus.br/editais/edital.pdf')).rejects.toMatchObject({ status: 502 });
  });

  it('rejects a body whose declared content-length exceeds 20MB', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeResponse({
        status: 200,
        headers: { 'content-type': 'application/pdf', 'content-length': String(21 * 1024 * 1024) },
        body: PDF_BYTES,
      }) as any
    );

    await expect(fetchEditalPdf('https://www.trf1.jus.br/editais/edital.pdf')).rejects.toMatchObject({ status: 413 });
  });

  it('rejects a downloaded body that is not actually a PDF, even with an application/pdf content-type', async () => {
    const notAPdf = new TextEncoder().encode('<html>not a pdf</html>');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeResponse({ status: 200, headers: { 'content-type': 'application/pdf' }, body: notAPdf }) as any
    );

    await expect(fetchEditalPdf('https://www.trf1.jus.br/editais/edital.pdf')).rejects.toMatchObject({ status: 502 });
  });

  it('accepts application/octet-stream when the body has the %PDF- magic bytes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeResponse({ status: 200, headers: { 'content-type': 'application/octet-stream' }, body: PDF_BYTES }) as any
    );

    const file = await fetchEditalPdf('https://www.trf1.jus.br/editais/edital.pdf');

    expect(file.type).toBe('application/pdf');
    expect(file.name).toBe('edital.pdf');
  });

  it('follows a redirect, re-validating the new host, and returns the final PDF', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy
      .mockResolvedValueOnce(
        fakeResponse({ status: 302, headers: { location: 'https://cdn.trf1.jus.br/editais/edital.pdf' } }) as any
      )
      .mockResolvedValueOnce(
        fakeResponse({ status: 200, headers: { 'content-type': 'application/pdf' }, body: PDF_BYTES }) as any
      );

    const file = await fetchEditalPdf('https://www.trf1.jus.br/editais/edital.pdf');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(lookupMock).toHaveBeenCalledTimes(2);
    expect(file.type).toBe('application/pdf');
  });

  it('gives up after too many redirects', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fakeResponse({ status: 302, headers: { location: 'https://www.trf1.jus.br/editais/next.pdf' } }) as any
    );

    await expect(fetchEditalPdf('https://www.trf1.jus.br/editais/edital.pdf')).rejects.toMatchObject({ status: 502 });
  });

  it('rejects a non-2xx, non-redirect response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fakeResponse({ status: 404 }) as any);

    await expect(fetchEditalPdf('https://www.trf1.jus.br/editais/missing.pdf')).rejects.toMatchObject({ status: 502 });
  });
});
