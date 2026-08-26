import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseProperties } from '@/lib/properties-parser';

async function readPtProperties(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(join(process.cwd(), 'public', 'messages', 'pt.properties'), 'utf-8');
    return parseProperties(raw);
  } catch {
    return {};
  }
}

// Full set — used by route groups (workspace, admin) whose components draw on most
// of the file, where filtering risks silently dropping a key some component still needs.
export async function loadAllMessages(): Promise<Record<string, string>> {
  return readPtProperties();
}

// Marketing pages only ever use a handful of prefixes, but the root layout used to load
// every key regardless — inlining chat/exam-editor copy into a public exam landing page's
// HTML, diluting its topical relevance and adding ~100KB of dead weight to first byte.
export async function loadMessagesForPrefixes(prefixes: readonly string[]): Promise<Record<string, string>> {
  const all = await readPtProperties();
  const filtered: Record<string, string> = {};

  for (const [key, value] of Object.entries(all)) {
    if (prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}.`))) {
      filtered[key] = value;
    }
  }

  return filtered;
}
