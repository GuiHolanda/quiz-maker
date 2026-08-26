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

export async function loadAllMessages(): Promise<Record<string, string>> {
  return readPtProperties();
}

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
