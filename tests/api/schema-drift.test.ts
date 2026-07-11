import { readFileSync } from 'fs';
import path from 'path';
import { createClient, type Client } from '@libsql/client';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

const PROD_SCHEMA_PATH = path.resolve(__dirname, '../../prisma/prod/schema.prisma');
const DEV_DB_PATH = path.resolve(__dirname, '../../prisma/dev.db');

interface ParsedModel {
  readonly name: string;
  readonly fields: readonly string[];
}

function parseProdModels(schema: string): ParsedModel[] {
  const models: ParsedModel[] = [];
  const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/g;

  let match: RegExpExecArray | null;
  while ((match = modelRegex.exec(schema)) !== null) {
    const name = match[1];
    const body = match[2];
    const fields: string[] = [];

    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      if (line.length === 0) continue;
      // Skip block-level directives (@@unique, @@index, etc.)
      if (line.startsWith('@@')) continue;
      // Skip comments
      if (line.startsWith('//')) continue;
      // Skip explicit relation fields
      if (line.includes('@relation')) continue;

      const tokens = line.split(/\s+/);
      const fieldName = tokens[0];
      const fieldType = tokens[1];
      if (!fieldName || !fieldType) continue;

      // Skip relation fields: type references another model (uppercase first letter),
      // optionally followed by [] or ?. Scalar/enum-ish types we keep are the known
      // Prisma scalars. Anything whose base type is another model is a relation.
      const baseType = fieldType.replace(/[\[\]?]/g, '');
      const scalarTypes = new Set([
        'String',
        'Int',
        'BigInt',
        'Float',
        'Decimal',
        'Boolean',
        'DateTime',
        'Json',
        'Bytes',
      ]);
      if (!scalarTypes.has(baseType)) continue;

      // List types (String[]) are not real columns in relational DBs.
      if (fieldType.includes('[]')) continue;

      fields.push(fieldName);
    }

    models.push({ name, fields });
  }

  return models;
}

describe('prod/dev schema drift', () => {
  let db: Client;

  beforeAll(() => {
    db = createClient({ url: `file:${DEV_DB_PATH}` });
  });

  afterAll(() => {
    db.close();
  });

  it('every scalar field in the prod schema exists as a column in the dev SQLite DB', async () => {
    const schema = readFileSync(PROD_SCHEMA_PATH, 'utf-8');
    const models = parseProdModels(schema);

    const missing: string[] = [];

    for (const model of models) {
      const info = await db.execute(`PRAGMA table_info("${model.name}")`);

      // Skip models whose table doesn't exist in the dev DB yet.
      if (info.rows.length === 0) continue;

      const columns = new Set(info.rows.map((row) => String(row.name)));

      for (const field of model.fields) {
        if (!columns.has(field)) {
          missing.push(`${model.name}.${field}`);
        }
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Schema drift detected: the following prod schema fields are missing from the dev SQLite DB:\n` +
          missing.map((f) => `  - ${f}`).join('\n') +
          `\n\nThe prod schema was likely changed without a corresponding migration. ` +
          `Run: npm run prisma:migrate:dev`,
      );
    }

    expect(missing).toEqual([]);
  });
});
