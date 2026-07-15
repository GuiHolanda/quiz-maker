import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const PROD_MIGRATIONS_DIR = path.resolve(__dirname, '../../../prisma/prod/migrations');
const DEV_MIGRATIONS_DIR = path.resolve(__dirname, '../../../prisma/dev/migrations');

function getMigrationFolders(dir: string): string[] {
  return readdirSync(dir).filter((entry) => {
    if (entry === 'migration_lock.toml') return false;
    return statSync(path.join(dir, entry)).isDirectory();
  });
}

function getMigrationSuffix(folderName: string): string {
  // "20260715004212_add_token_fields_to_usage_log" → "add_token_fields_to_usage_log"
  const underscoreIndex = folderName.indexOf('_');
  return underscoreIndex === -1 ? folderName : folderName.slice(underscoreIndex + 1);
}

describe('migration completeness', () => {
  it('every prod migration folder contains a non-empty migration.sql', () => {
    const folders = getMigrationFolders(PROD_MIGRATIONS_DIR);
    const empty: string[] = [];

    for (const folder of folders) {
      const sqlPath = path.join(PROD_MIGRATIONS_DIR, folder, 'migration.sql');
      let content: string;
      try {
        content = readFileSync(sqlPath, 'utf-8');
      } catch {
        empty.push(`${folder} (migration.sql missing)`);
        continue;
      }
      if (content.trim().length === 0) {
        empty.push(`${folder} (migration.sql is empty)`);
      }
    }

    if (empty.length > 0) {
      throw new Error(
        `Prod migrations with missing or empty migration.sql:\n` +
          empty.map((f) => `  - ${f}`).join('\n') +
          `\n\nAdd the PostgreSQL SQL to each file listed above.`,
      );
    }

    expect(empty).toEqual([]);
  });

  it('every dev migration newer than the latest prod migration also exists in prod', () => {
    // Dev and prod have intentionally different migration histories for older entries
    // (prod was bootstrapped from a consolidated init). The invariant that matters
    // going forward: any dev migration with a timestamp strictly newer than the
    // latest prod migration must also have an equivalent folder+sql in prod.
    const devFolders = getMigrationFolders(DEV_MIGRATIONS_DIR);
    const prodFolders = getMigrationFolders(PROD_MIGRATIONS_DIR);

    const getMigrationTimestamp = (folderName: string) => folderName.slice(0, 14);

    const latestProdTimestamp = prodFolders
      .map(getMigrationTimestamp)
      .sort()
      .at(-1) ?? '0';

    const prodSuffixes = new Set(prodFolders.map(getMigrationSuffix));
    const missing: string[] = [];

    for (const devFolder of devFolders) {
      const timestamp = getMigrationTimestamp(devFolder);
      if (timestamp <= latestProdTimestamp) continue;

      const suffix = getMigrationSuffix(devFolder);
      if (!prodSuffixes.has(suffix)) {
        missing.push(`${devFolder} (suffix "${suffix}" not found in prod migrations)`);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Dev migrations newer than latest prod migration with no prod equivalent:\n` +
          missing.map((f) => `  - ${f}`).join('\n') +
          `\n\nCreate a matching migration folder + migration.sql under prisma/prod/migrations/.`,
      );
    }

    expect(missing).toEqual([]);
  });
});
