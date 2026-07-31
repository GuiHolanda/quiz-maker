#!/usr/bin/env npx tsx
/**
 * Migration safety linter — runs in CI on every PR.
 *
 * Catches ADD COLUMN NOT NULL without a DEFAULT on an existing table
 * (the class of bug that caused P3018 in 20260729215326_unify_exam_schema).
 *
 * Safe patterns that are explicitly allowed:
 *   1. ADD COLUMN ... NOT NULL DEFAULT ...
 *   2. ADD COLUMN inside a CREATE TABLE block (new table, no existing rows)
 *   3. ADD COLUMN on a table that has DELETE FROM <table> earlier in the same file
 *      (explicit backfill/clear, as documented in the migration comment)
 */

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'prisma/prod/migrations');

interface Finding {
  file: string;
  line: number;
  text: string;
}

function extractTableName(line: string): string | null {
  const match = line.match(/ALTER\s+TABLE\s+"?(\w+)"?/i);
  return match ? match[1] : null;
}

function deletedTables(lines: string[]): Set<string> {
  const deleted = new Set<string>();
  for (const line of lines) {
    const match = line.match(/^\s*DELETE\s+FROM\s+"?(\w+)"?/i);
    if (match) deleted.add(match[1]);
  }
  return deleted;
}

function checkFile(filePath: string, relativeName: string): Finding[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings: Finding[] = [];

  const cleared = deletedTables(lines);

  let insideCreateTable = false;
  let currentAlterTable: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();

    if (upper.includes('CREATE TABLE')) {
      insideCreateTable = true;
      currentAlterTable = null;
    }
    if (insideCreateTable && line.trim() === ');') {
      insideCreateTable = false;
    }

    if (insideCreateTable) continue;

    if (upper.includes('ALTER TABLE')) {
      currentAlterTable = extractTableName(line);
    }

    // Detect: ADD COLUMN ... NOT NULL with no DEFAULT
    if (upper.includes('ADD COLUMN') && upper.includes('NOT NULL') && !upper.includes('DEFAULT')) {
      // Safe if the table was explicitly cleared (DELETE FROM) earlier in this file
      if (currentAlterTable && cleared.has(currentAlterTable)) continue;
      findings.push({ file: relativeName, line: i + 1, text: line.trim() });
    }
  }

  return findings;
}

function main() {
  let migrations: string[];
  try {
    migrations = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    console.error(`Could not read migrations directory: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const allFindings: Finding[] = [];

  for (const migration of migrations) {
    const sqlPath = join(MIGRATIONS_DIR, migration, 'migration.sql');
    try {
      const findings = checkFile(sqlPath, `${migration}/migration.sql`);
      allFindings.push(...findings);
    } catch {
      // migration folder has no SQL file (e.g. migration_lock.toml folder)
    }
  }

  if (allFindings.length === 0) {
    console.log('Migration safety check passed — no unsafe ADD COLUMN NOT NULL found.');
    process.exit(0);
  }

  console.error('Migration safety check FAILED\n');
  console.error(
    'Found ADD COLUMN NOT NULL without DEFAULT — this will fail on a table that already has rows.\n' +
      'Fix options:\n' +
      '  1. Add a DEFAULT value:  ADD COLUMN "col" TEXT NOT NULL DEFAULT \'\'\n' +
      '  2. Delete rows first:    DELETE FROM "TableName";  (before the ALTER TABLE)\n'
  );

  for (const f of allFindings) {
    console.error(`  ${f.file}:${f.line}`);
    console.error(`  > ${f.text}\n`);
  }

  process.exit(1);
}

main();
