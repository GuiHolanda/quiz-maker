/**
 * Edital Identification & Extraction Benchmark
 *
 * Calls identifyExam(), locateEdital() and EditalExtractorService.extract() — the exact
 * production functions, no reimplementation — against the real OpenAI API, and scores the
 * result against two real editais with a hand-verified gabarito (edital-fixtures/expected.ts).
 *
 * This exists because the unit suite mocks openAIService.call() end to end: it proves the
 * pipeline *routes* correctly, never that the LLM's answer is *right*. That's exactly the gap
 * that let the Transpetro 2026.4 regression (locate only ever found 2023/2024 editais) ship
 * with 45 green tests. See the "Benchmark de identificação..." plan for the full rationale,
 * including why this is a benchmark and not a live-API E2E test.
 *
 * Two stages, scored and reported separately, so a regression points at a stage instead of a
 * vague "it's worse now":
 *   - search  — identifyExam + locateEdital, real web_search, non-deterministic. Scored on
 *               candidate PROPERTIES (year, verification, domain), never on the exact URL.
 *   - extract — EditalExtractorService.extract() against the LOCAL PDF fixture, not whatever
 *               URL search found. Deterministic input isolates extraction quality from search
 *               flakiness.
 *
 * Not part of CI: costs real money, hits third-party portals over the network (search stage),
 * and the LLM is non-deterministic by design. Run manually before a release that touches
 * identify/locate/extract, or after switching OPENAI_MODEL(_IDENTIFY|_LOCATE).
 *
 * USAGE
 *
 *   # full run (both stages, both fixtures)
 *   DATABASE_URL="file:$PWD/prisma/dev.db" npm run eval:edital
 *
 *   # one fixture only
 *   DATABASE_URL="file:$PWD/prisma/dev.db" npm run eval:edital -- --fixture transpetro
 *
 *   # extract only — no network/search, cheap and deterministic input
 *   DATABASE_URL="file:$PWD/prisma/dev.db" npm run eval:edital -- --stage extract
 *
 *   # N repetitions, to measure how much the search stage oscillates
 *   DATABASE_URL="file:$PWD/prisma/dev.db" npm run eval:edital -- --runs 3
 *
 *   # compare two saved reports
 *   npm run eval:edital -- --compare scripts/eval/results/A.json scripts/eval/results/B.json
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

import { PRICING_USD, computeCost, saveResults, loadReport, printTable } from './report';
import { EXPECTED_EDITAIS, type ExpectedEdital } from './edital-fixtures/expected';
import {
  scoreIdentify,
  scoreLocate,
  scoreDeterministic,
  scoreTopicCoverage,
  combineExtractionScore,
  type IdentifyScore,
  type LocateScore,
  type ExtractionScore,
} from './edital-scoring';

// These import the real production code — no reimplementation, no `@/` resolution issue (tsx
// with --tsconfig resolves the alias fine; see plan's "Viabilidade" section for the probe that
// established this).
import { identifyExam, locateEdital, type IdentifyMatch } from '../../features/services/auto-config-job.service';
import { EditalExtractorService } from '../../features/services/edital-extractor.service';
import { prisma } from '../../lib/prisma';
import type { EditalCandidate } from '../../shared/types';

const EVAL_USER_EMAIL = 'eval-bench@certifiqueai.local';

// Self-provisions its own user rather than depending on the e2e fixture user existing — the
// only requirement on dev.db is that it's migrated. Plan 'tester' isn't load-bearing (none of
// identifyExam/locateEdital/extract check quota), but it signals intent if that ever changes.
async function getOrCreateEvalUser(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: EVAL_USER_EMAIL },
    update: { plan: 'tester' },
    create: { email: EVAL_USER_EMAIL, name: 'Eval Benchmark', plan: 'tester', emailVerified: new Date() },
  });
  return user.id;
}

function loadFixturePdf(pdfFile: string): File {
  const filePath = path.join(__dirname, 'edital-fixtures', pdfFile);
  const bytes = fs.readFileSync(filePath);
  return new File([bytes], pdfFile, { type: 'application/pdf' });
}

// ── Search stage (identify + locate) ────────────────────────────────────────────
interface SearchStageResult {
  fixtureId: string;
  label: string;
  run: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  costBRL: number;
  identifyScore: IdentifyScore;
  locateScore: LocateScore;
  bestMatch: IdentifyMatch | null;
  candidate: EditalCandidate | null;
  overall: number; // 0-10, 30% identify + 70% locate
  passed: boolean;
  error?: string;
}

const PASS_MIN_SEARCH_SCORE = 7.0;

// identifyExam and locateEdital each create and finalize their own UsageLog (action
// 'auto_config') internally and don't return token usage to the caller — same situation as
// extract() (see readLastExtractTokens below). Reading everything logged after `sinceMs` also
// picks up locate's internal verify_edital steps (EditalExtractorService.verifyIsMainEdital,
// called once per downloaded candidate), which is real cost this benchmark should report.
async function readAutoConfigTokensSince(userId: string, sinceMs: number): Promise<{ inputTokens: number; outputTokens: number }> {
  const logs = await prisma.usageLog.findMany({
    where: { userId, action: 'auto_config', createdAt: { gte: new Date(sinceMs) } },
    include: { steps: true },
  });
  let inputTokens = 0;
  let outputTokens = 0;
  for (const log of logs) {
    for (const step of log.steps) {
      inputTokens += step.inputTokens;
      outputTokens += step.outputTokens;
    }
  }
  return { inputTokens, outputTokens };
}

async function runSearchStage(fixture: ExpectedEdital, userId: string, run: number): Promise<SearchStageResult> {
  console.log(`  [search] ${fixture.label} (run ${run})...`);
  const t0 = Date.now();

  try {
    const identifyResult = await identifyExam(userId, fixture.identifyQuery, 'public_exam', 'pt');
    const bestMatch = identifyResult.matches[0] ?? null;
    const identifyScore = scoreIdentify(fixture, bestMatch);

    let candidate: EditalCandidate | null = null;
    let locateScore: LocateScore;

    if (bestMatch) {
      const locateResult = await locateEdital(userId, {
        examName: bestMatch.label,
        examBoard: bestMatch.examBoard,
        editalKey: bestMatch.key,
        year: bestMatch.year,
        role: fixture.role,
        language: 'pt',
      });
      candidate = locateResult.editais[0] ?? null;
      locateScore = scoreLocate(fixture, candidate);
    } else {
      // Mirrors production: SeedIdentifyCard never calls locate without a confirmed identify
      // match to seed it from. No match found means the search stage failed at step 1.
      locateScore = scoreLocate(fixture, null);
    }

    const latencyMs = Date.now() - t0;
    const { inputTokens, outputTokens } = await readAutoConfigTokensSince(userId, t0);
    const { costUSD, costBRL } = computeCost(inputTokens, outputTokens);
    const overall = (identifyScore.score * 0.3 + locateScore.score * 0.7) * 10;
    const passed = overall >= PASS_MIN_SEARCH_SCORE;

    const icon = passed ? '✓' : '✗';
    console.log(
      `    ${icon} ${latencyMs}ms | identify ${(identifyScore.score * 100).toFixed(0)}% | locate ${(locateScore.score * 100).toFixed(0)}% | score ${overall.toFixed(1)}/10`
    );

    return {
      fixtureId: fixture.id,
      label: fixture.label,
      run,
      latencyMs,
      inputTokens,
      outputTokens,
      costUSD,
      costBRL,
      identifyScore,
      locateScore,
      bestMatch,
      candidate,
      overall,
      passed,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`    ✗ ERROR: ${message}`);
    const emptyIdentify = scoreIdentify(fixture, null);
    const emptyLocate = scoreLocate(fixture, null);
    return {
      fixtureId: fixture.id,
      label: fixture.label,
      run,
      latencyMs: Date.now() - t0,
      inputTokens: 0,
      outputTokens: 0,
      costUSD: 0,
      costBRL: 0,
      identifyScore: emptyIdentify,
      locateScore: emptyLocate,
      bestMatch: null,
      candidate: null,
      overall: 0,
      passed: false,
      error: message,
    };
  }
}

// ── Extract stage ────────────────────────────────────────────────────────────────
interface ExtractStageResult {
  fixtureId: string;
  label: string;
  run: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  costBRL: number;
  extraction: ExtractionScore;
  passed: boolean;
  error?: string;
}

// EditalExtractorService.extract() records its own token usage under a UsageLog it creates
// itself (action 'extract_edital') and doesn't return the numbers to the caller — reading them
// back here (read-only) avoids having to change production code just to report benchmark cost.
// Picks the most recent log for this user/action, which is safe because the benchmark runs its
// stages sequentially against a dedicated eval user.
async function readLastExtractTokens(userId: string): Promise<{ inputTokens: number; outputTokens: number }> {
  const log = await prisma.usageLog.findFirst({
    where: { userId, action: 'extract_edital' },
    orderBy: { createdAt: 'desc' },
    include: { steps: { where: { step: 'extract' } } },
  });
  const step = log?.steps[0];
  return { inputTokens: step?.inputTokens ?? 0, outputTokens: step?.outputTokens ?? 0 };
}

async function runExtractStage(
  fixture: ExpectedEdital,
  userId: string,
  run: number,
  editalExtractorService: EditalExtractorService,
  openAIClient: OpenAI
): Promise<ExtractStageResult> {
  console.log(`  [extract] ${fixture.label} (run ${run})...`);
  const t0 = Date.now();

  try {
    const file = loadFixturePdf(fixture.pdfFile);
    const exam = await editalExtractorService.extract(userId, file, fixture.role);
    const extractTokens = await readLastExtractTokens(userId);

    const deterministic = scoreDeterministic(fixture, exam);

    const topicCoverage = await Promise.all(
      fixture.sections.map(async (expectedSection) => {
        const actualSection = exam.sections.find((s) => {
          const a = s.name.toLowerCase();
          const e = expectedSection.name.toLowerCase();
          return a === e || a.includes(e) || e.includes(a);
        });
        const actualTopics = actualSection?.topics?.map((t) => t.name) ?? [];
        return scoreTopicCoverage(expectedSection.name, expectedSection.topicsSample, actualTopics, openAIClient);
      })
    );

    const inputTokens = extractTokens.inputTokens + topicCoverage.reduce((sum, t) => sum + t.inputTokens, 0);
    const outputTokens = extractTokens.outputTokens + topicCoverage.reduce((sum, t) => sum + t.outputTokens, 0);
    const { costUSD, costBRL } = computeCost(inputTokens, outputTokens);

    const extraction = combineExtractionScore(deterministic, topicCoverage);
    const latencyMs = Date.now() - t0;
    const passed = extraction.passed;

    const icon = passed ? '✓' : '✗';
    console.log(
      `    ${icon} ${latencyMs}ms | ${inputTokens}in/${outputTokens}out | $${costUSD.toFixed(5)} | fields ${deterministic.passedCount}/${deterministic.totalCount} | topics ${(extraction.avgTopicCoverageScore * 100).toFixed(0)}% | score ${extraction.overall.toFixed(1)}/10`
    );

    return { fixtureId: fixture.id, label: fixture.label, run, latencyMs, inputTokens, outputTokens, costUSD, costBRL, extraction, passed };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`    ✗ ERROR: ${message}`);
    const emptyDeterministic = { checks: [], passedCount: 0, totalCount: 0, score: 0 };
    const emptyExtraction = combineExtractionScore(emptyDeterministic, []);
    return {
      fixtureId: fixture.id,
      label: fixture.label,
      run,
      latencyMs: Date.now() - t0,
      inputTokens: 0,
      outputTokens: 0,
      costUSD: 0,
      costBRL: 0,
      extraction: emptyExtraction,
      passed: false,
      error: message,
    };
  }
}

// ── Report ───────────────────────────────────────────────────────────────────────
interface EditalBenchmarkReport {
  model: string; // used by saveResults() for the filename — OPENAI_MODEL_LOCATE || OPENAI_MODEL
  modelIdentify: string;
  modelLocate: string;
  modelExtract: string;
  timestamp: string;
  pricingUSD: typeof PRICING_USD;
  runs: number;
  summary: {
    totalCostUSD: number;
    totalCostBRL: number;
    avgSearchScore: number;
    avgExtractionScore: number;
    searchPassed: number;
    searchTotal: number;
    extractPassed: number;
    extractTotal: number;
    passed: boolean;
  };
  search: SearchStageResult[];
  extract: ExtractStageResult[];
}

function buildReport(search: SearchStageResult[], extract: ExtractStageResult[], runs: number): EditalBenchmarkReport {
  const totalCostUSD = search.reduce((s, r) => s + r.costUSD, 0) + extract.reduce((s, r) => s + r.costUSD, 0);
  const totalCostBRL = search.reduce((s, r) => s + r.costBRL, 0) + extract.reduce((s, r) => s + r.costBRL, 0);
  const avgSearchScore = search.length ? search.reduce((s, r) => s + r.overall, 0) / search.length : 0;
  const avgExtractionScore = extract.length ? extract.reduce((s, r) => s + r.extraction.overall, 0) / extract.length : 0;
  const searchPassed = search.filter((r) => r.passed).length;
  const extractPassed = extract.filter((r) => r.passed).length;

  return {
    model: process.env.OPENAI_MODEL_LOCATE || process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    modelIdentify: process.env.OPENAI_MODEL_IDENTIFY || process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    modelLocate: process.env.OPENAI_MODEL_LOCATE || process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    modelExtract: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    timestamp: new Date().toISOString(),
    pricingUSD: PRICING_USD,
    runs,
    summary: {
      totalCostUSD,
      totalCostBRL,
      avgSearchScore: Math.round(avgSearchScore * 100) / 100,
      avgExtractionScore: Math.round(avgExtractionScore * 100) / 100,
      searchPassed,
      searchTotal: search.length,
      extractPassed,
      extractTotal: extract.length,
      passed: (search.length === 0 || searchPassed === search.length) && (extract.length === 0 || extractPassed === extract.length),
    },
    search,
    extract,
  };
}

// ── Compare two result files ───────────────────────────────────────────────────
function compareReports(pathA: string, pathB: string): void {
  const a = loadReport<EditalBenchmarkReport>(pathA);
  const b = loadReport<EditalBenchmarkReport>(pathB);

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Comparison: ${a.modelIdentify}/${a.modelLocate}/${a.modelExtract}  vs  ${b.modelIdentify}/${b.modelLocate}/${b.modelExtract}`);
  console.log(`${'═'.repeat(70)}`);

  printTable(
    ['Metric', 'A', 'B', 'Δ (B vs A)'],
    [
      ['Total cost USD', `$${a.summary.totalCostUSD.toFixed(5)}`, `$${b.summary.totalCostUSD.toFixed(5)}`, ''],
      ['Avg search score', a.summary.avgSearchScore.toFixed(2), b.summary.avgSearchScore.toFixed(2), `${(b.summary.avgSearchScore - a.summary.avgSearchScore).toFixed(2)} pts`],
      [
        'Avg extraction score',
        a.summary.avgExtractionScore.toFixed(2),
        b.summary.avgExtractionScore.toFixed(2),
        `${(b.summary.avgExtractionScore - a.summary.avgExtractionScore).toFixed(2)} pts`,
      ],
      ['Search passed', `${a.summary.searchPassed}/${a.summary.searchTotal}`, `${b.summary.searchPassed}/${b.summary.searchTotal}`, ''],
      ['Extract passed', `${a.summary.extractPassed}/${a.summary.extractTotal}`, `${b.summary.extractPassed}/${b.summary.extractTotal}`, ''],
    ],
    [24, 18, 18, 16]
  );
  console.log('');
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  const compareIdx = args.indexOf('--compare');
  if (compareIdx !== -1) {
    const fileA = args[compareIdx + 1];
    const fileB = args[compareIdx + 2];
    if (!fileA || !fileB) {
      console.error('Usage: --compare <fileA.json> <fileB.json>');
      process.exit(1);
    }
    compareReports(fileA, fileB);
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not set — this benchmark writes UsageLog rows via the real services.');
    console.error('Example: DATABASE_URL="file:$PWD/prisma/dev.db" npm run eval:edital');
    process.exit(1);
  }

  const fixtureIdx = args.indexOf('--fixture');
  const fixtureFilter = fixtureIdx !== -1 ? args[fixtureIdx + 1] : null;
  const fixtures = fixtureFilter ? EXPECTED_EDITAIS.filter((f) => f.id === fixtureFilter) : EXPECTED_EDITAIS;
  if (!fixtures.length) {
    console.error(`Error: no fixture found with id "${fixtureFilter}"`);
    console.error(`Available: ${EXPECTED_EDITAIS.map((f) => f.id).join(', ')}`);
    process.exit(1);
  }

  const stageIdx = args.indexOf('--stage');
  const stage = stageIdx !== -1 ? args[stageIdx + 1] : 'all';
  if (!['search', 'extract', 'all'].includes(stage)) {
    console.error(`Error: --stage must be "search", "extract" or "all" (got "${stage}")`);
    process.exit(1);
  }

  const runsIdx = args.indexOf('--runs');
  const runs = runsIdx !== -1 ? Number(args[runsIdx + 1]) : 1;
  if (!Number.isInteger(runs) || runs < 1) {
    console.error(`Error: --runs must be a positive integer (got "${args[runsIdx + 1]}")`);
    process.exit(1);
  }

  const userId = await getOrCreateEvalUser();
  const openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 280_000, maxRetries: 0 });
  const editalExtractorService = new EditalExtractorService();

  console.log(`\nEdital Identify/Locate/Extract Benchmark`);
  console.log(`Fixtures         : ${fixtures.map((f) => f.id).join(', ')}`);
  console.log(`Stage            : ${stage}`);
  console.log(`Runs             : ${runs}`);
  console.log(`Model (identify) : ${process.env.OPENAI_MODEL_IDENTIFY || process.env.OPENAI_MODEL}`);
  console.log(`Model (locate)   : ${process.env.OPENAI_MODEL_LOCATE || process.env.OPENAI_MODEL}`);
  console.log(`Model (extract)  : ${process.env.OPENAI_MODEL}`);
  console.log(`${'─'.repeat(60)}\n`);

  const search: SearchStageResult[] = [];
  const extract: ExtractStageResult[] = [];

  for (let run = 1; run <= runs; run++) {
    for (const fixture of fixtures) {
      if (stage === 'search' || stage === 'all') {
        search.push(await runSearchStage(fixture, userId, run));
      }
      if (stage === 'extract' || stage === 'all') {
        extract.push(await runExtractStage(fixture, userId, run, editalExtractorService, openAIClient));
      }
    }
  }

  const report = buildReport(search, extract, runs);
  const filepath = saveResults(report, 'edital');

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`Total cost      : $${report.summary.totalCostUSD.toFixed(5)} USD / R$${report.summary.totalCostBRL.toFixed(4)} BRL`);
  if (search.length) console.log(`Search score    : ${report.summary.avgSearchScore.toFixed(2)}/10 (${report.summary.searchPassed}/${report.summary.searchTotal} passed)`);
  if (extract.length) console.log(`Extraction score: ${report.summary.avgExtractionScore.toFixed(2)}/10 (${report.summary.extractPassed}/${report.summary.extractTotal} passed)`);
  console.log(`Overall result  : ${report.summary.passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`\nResults saved   : ${filepath}`);
  console.log('');

  await prisma.$disconnect();
  process.exit(report.summary.passed ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
