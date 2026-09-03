import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { MARKETING_MESSAGE_PREFIXES, WORKSPACE_MESSAGE_PREFIXES } from '@/config/i18n-prefixes';

// Os layouts não mandam mais o .properties inteiro para o cliente — cada um declara os
// prefixos que sua árvore usa. Uma chave fora dos prefixos declarados não quebra o build
// nem o tsc: ela chega no navegador como o próprio texto da chave. Este teste é a única
// coisa entre um `t('homepage.x')` novo numa tela do workspace e "homepage.x" na tela.

const KEY_LIKE = /['"`]([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)['"`]/g;
const INTERPOLATED_KEY = /`([a-zA-Z][a-zA-Z0-9_.]*)\$\{/g;

function allMessageKeys(): Set<string> {
  const raw = readFileSync(join(process.cwd(), 'public', 'messages', 'pt.properties'), 'utf-8');

  return new Set(
    raw
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('#') && line.includes('='))
      .map((line) => line.slice(0, line.indexOf('=')).trim())
  );
}

function sourceFiles(roots: string[]): string[] {
  const found: string[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.tsx?$/.test(entry.name)) found.push(path);
    }
  }

  for (const root of roots) walk(join(process.cwd(), root));

  return found;
}

// Superset deliberado: varre a árvore inteira sem seguir o grafo de imports, então pode
// apontar um prefixo a mais — nunca um a menos. Errar para o lado de manter é seguro.
function referencedPrefixes(roots: string[], keys: Set<string>): Set<string> {
  const prefixes = new Set<string>();

  for (const file of sourceFiles(roots)) {
    const src = readFileSync(file, 'utf-8');

    for (const match of Array.from(src.matchAll(KEY_LIKE))) {
      if (keys.has(match[1])) prefixes.add(match[1].split('.')[0]);
    }

    for (const match of Array.from(src.matchAll(INTERPOLATED_KEY))) {
      const root = match[1].replace(/[._]+$/, '').split('.')[0];
      if (root && Array.from(keys).some((key) => key.startsWith(`${root}.`))) prefixes.add(root);
    }
  }

  return prefixes;
}

describe('prefixos de i18n declarados pelos layouts', () => {
  const keys = allMessageKeys();

  it('workspace declara todo prefixo que sua árvore referencia', () => {
    const needed = referencedPrefixes(['app/(workspace)', 'shared', 'features', 'config'], keys);
    const missing = Array.from(needed).filter((prefix) => !WORKSPACE_MESSAGE_PREFIXES.includes(prefix as never));

    expect(missing).toEqual([]);
  });

  it('marketing declara todo prefixo que suas páginas e componentes referenciam', () => {
    const needed = referencedPrefixes(['app/(marketing)'], keys);
    const missing = Array.from(needed).filter((prefix) => !MARKETING_MESSAGE_PREFIXES.includes(prefix as never));

    expect(missing).toEqual([]);
  });

  it('todo prefixo declarado corresponde a chaves que existem no .properties', () => {
    const declared = Array.from(new Set([...MARKETING_MESSAGE_PREFIXES, ...WORKSPACE_MESSAGE_PREFIXES]));
    const orphans = declared.filter(
      (prefix) => !Array.from(keys).some((key) => key === prefix || key.startsWith(`${prefix}.`))
    );

    expect(orphans).toEqual([]);
  });
});
