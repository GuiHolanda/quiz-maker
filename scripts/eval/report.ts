// Shared plumbing for scripts/eval/*.ts benchmark runners: cost math, JSON result persistence,
// and a plain-text comparison table. Extracted from benchmark.ts (which used to inline all of
// this) so edital-benchmark.ts doesn't duplicate it — see the "Benchmark de identificação..."
// plan for the rationale.

import * as fs from 'fs';
import * as path from 'path';

// Mirrors config/constants/index.ts ACTIVE_MODEL_PRICING_USD. Updated manually when the
// active model changes; overridable via env for one-off comparisons against a different model's
// published pricing.
export const PRICING_USD = {
  inputPerMillion: Number(process.env.EVAL_PRICE_INPUT ?? 0.75),
  outputPerMillion: Number(process.env.EVAL_PRICE_OUTPUT ?? 4.5),
};
export const USD_TO_BRL = 5.7;

export function computeCost(inputTokens: number, outputTokens: number): { costUSD: number; costBRL: number } {
  const costUSD =
    (inputTokens / 1_000_000) * PRICING_USD.inputPerMillion + (outputTokens / 1_000_000) * PRICING_USD.outputPerMillion;
  return { costUSD, costBRL: costUSD * USD_TO_BRL };
}

// Writes `report` to scripts/eval/results/<timestamp>[_<prefix>]_<model>.json and returns the
// path. `report` must carry a `model` field — used both in the filename and, by convention,
// echoed back by callers of loadReport. `prefix` is omitted from the filename when empty, which
// keeps benchmark.ts's original naming (<ts>_<model>.json) unchanged.
export function saveResults<T extends { model: string }>(report: T, prefix = ''): string {
  const resultsDir = path.join(__dirname, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });

  const ts = new Date().toISOString().replace(/:/g, '-').replace('T', '_').slice(0, 16);
  const modelSlug = report.model.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${ts}${prefix ? `_${prefix}` : ''}_${modelSlug}.json`;
  const filepath = path.join(resultsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  return filepath;
}

export function loadReport<T>(filepath: string): T {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8')) as T;
}

// Fixed-width text table shared by every --compare mode. Callers build headers/rows; this only
// pads and prints. `colWidths` defaults to a width derived from the header text.
export function printTable(headers: readonly string[], rows: readonly (readonly string[])[], colWidths?: readonly number[]): void {
  const widths = colWidths ?? headers.map((h) => Math.max(h.length + 2, 14));
  const fmt = (row: readonly string[]) => row.map((v, i) => (v ?? '').padEnd(widths[i] ?? 14)).join('  ');

  console.log(fmt(headers));
  console.log('-'.repeat(widths.reduce((sum, w) => sum + w + 2, 0)));
  rows.forEach((row) => console.log(fmt(row)));
}
