export function parseProperties(raw: string): Record<string, string> {
  const messages: Record<string, string> = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');

    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const raw_value = trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^'(.*)'$/, '$1')
      .replace(/^"(.*)"$/, '$1');
    const value = raw_value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    if (key) messages[key] = value;
  }

  return messages;
}
