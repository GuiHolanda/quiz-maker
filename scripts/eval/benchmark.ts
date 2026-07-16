/**
 * Model Eval Benchmark
 *
 * Calls the OpenAI Responses API with the same configuration as production
 * (web_search_preview, max_output_tokens: 16000) and measures latency, token
 * cost and question quality per domain via an independent LLM judge (gpt-5.6-sol).
 *
 * USAGE
 *
 *   # Run all scenarios
 *   OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-5.4-mini npx tsx scripts/eval/benchmark.ts
 *
 *   # Run a single scenario
 *   OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-5.4-mini npx tsx scripts/eval/benchmark.ts --scenario aws-cert
 *
 *   # Compare two saved result files
 *   npx tsx scripts/eval/benchmark.ts --compare scripts/eval/results/A.json scripts/eval/results/B.json
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { SCENARIOS, type Scenario } from './scenarios';
import { judgeQuestion, type JudgeScore } from './judge';

// ── Pricing (mirrors config/constants/index.ts ACTIVE_MODEL_PRICING_USD) ──────
// Updated manually when the active model changes.
const PRICING_USD = {
  inputPerMillion: Number(process.env.EVAL_PRICE_INPUT ?? 0.75),
  outputPerMillion: Number(process.env.EVAL_PRICE_OUTPUT ?? 4.50),
};
const USD_TO_BRL = 5.70;

// ── Types ──────────────────────────────────────────────────────────────────────
interface ScenarioResult {
  id: string;
  label: string;
  type: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  costBRL: number;
  questionsGenerated: number;
  judgeScore: JudgeScore;
  passed: boolean;
  generatedSample: string;
  error?: string;
}

interface BenchmarkReport {
  model: string;
  timestamp: string;
  pricingUSD: typeof PRICING_USD;
  summary: {
    totalCostUSD: number;
    totalCostBRL: number;
    avgLatencyMs: number;
    avgOverallScore: number;
    scenariosPassed: number;
    scenariosTotal: number;
    passed: boolean;
  };
  scenarios: ScenarioResult[];
}

// ── Thresholds ─────────────────────────────────────────────────────────────────
const PASS_MIN_JUDGE_SCORE = 7.0;
const PASS_MAX_LATENCY_MS = 30_000;

// ── Prompt builders (relative imports — no @/ aliases in tsx) ─────────────────
// We inline the build() calls to avoid the @/ resolution issue with tsx.
function buildCertificationPrompt(input: {
  certification_name: string;
  topic_name: string;
  num_questions: string;
}): string {
  const { certification_name, topic_name, num_questions } = input;
  return `You are an expert exam question writer for professional certification exams across any domain (technology, finance, engineering, healthcare, law, and others).

## STEP 1 — RESEARCH (execute before generating)

Search the web for real exam questions from the "${certification_name}" certification about the topic "${topic_name}". Use queries like:
- "${certification_name} exam questions ${topic_name} sample"
- "${certification_name} ${topic_name} practice questions"

Analyze found questions to identify: question style, common distractors, key concepts tested, and typical difficulty level for this certification.

## STEP 2 — GENERATE

Based on the research, create exactly ${num_questions} **original** questions (do not copy found questions) for:
- Certification: ${certification_name}
- Topic: ${topic_name}

Rules:
1. Use the same language as the official exam (search if unsure — some certifications test in the local language).
2. Reflect the style identified in research (vocabulary, typical distractors, depth).
3. Only factually correct content based on current official documentation or standards.
4. Do NOT indicate the correct answer — that happens in a separate step.
5. Each question must be self-contained.
6. Questions may be single-choice (correctCount: 1) or multiple-choice (correctCount: 2 or 3). Vary across the set.
7. Each question must have exactly 5 options labeled A, B, C, D, E.
8. Vary difficulty: mix easy, medium, and hard questions.
9. Favor scenario-based questions over pure recall when the domain allows.
10. Never use "All of the above" or "None of the above".

## OUTPUT

Respond **only** with the JSON below, no text before or after, no markdown fences:

{"questions":[{"id":1,"certificationTitle":"${certification_name}","text":"<question text>","correctCount":1,"topic":"${topic_name}","difficulty":"medium","options":{"A":"<text>","B":"<text>","C":"<text>","D":"<text>","E":"<text>"}}]}

Required fields per question: id, certificationTitle, text (≥20 chars), correctCount (1–3), topic, difficulty (easy/medium/hard), options (A–E non-empty).`;
}

function buildPublicExamPrompt(input: {
  public_exam_name: string;
  exam_board_name: string;
  subject_name: string;
  topic_name?: string;
  num_questions: string;
}): string {
  const { public_exam_name, exam_board_name, subject_name, topic_name, num_questions } = input;
  const topicoLine = topic_name ? `focadas no tópico "${topic_name}"` : 'cobrindo a matéria de forma ampla';

  return `Você é um especialista em concursos públicos brasileiros e vai gerar questões de alta fidelidade.

## ETAPA 1 — PESQUISA (execute antes de gerar)

Pesquise na web por questões reais da banca "${exam_board_name}" sobre "${subject_name}"${topic_name ? ` (tópico: "${topic_name}")` : ''} em concursos anteriores. Use queries como:
- "${exam_board_name} questões ${subject_name}${topic_name ? ` ${topic_name}` : ''} gabarito prova"
- site:qconcursos.com OR site:questoeseconcursos.com.br "${exam_board_name}" "${subject_name}"

Analise as questões encontradas para identificar: estilo de enunciado, pegadinhas típicas, dispositivos legais frequentes e nível de dificuldade habitual da banca.

## ETAPA 2 — GERAÇÃO

Com base na pesquisa, crie exatamente ${num_questions} questões **inéditas** (não copie as encontradas) para:
- Concurso: ${public_exam_name}
- Banca: ${exam_board_name}
- Matéria: ${subject_name}
- Foco: ${topicoLine}

Regras:
1. Português brasileiro formal, no padrão de prova oficial.
2. Reflita o estilo da banca pesquisada (vocabulário, pegadinhas, exigência).
3. Apenas conteúdo factualmente correto (leis, artigos, súmulas vigentes).
4. Não indique a resposta correta — isso ocorre em etapa separada.
5. Cada questão deve ser autocontida.

## SAÍDA

Responda **apenas** com o JSON abaixo, sem nenhum texto antes ou depois, sem markdown fences:

{"questions":[{"id":1,"text":"<enunciado>","correctCount":1,"publicExamName":"${public_exam_name}","examBoardName":"${exam_board_name}","subject":"${subject_name}",${topic_name ? `"topic":"${topic_name}",` : ''}"difficulty":"medium","options":{"A":"<texto>","B":"<texto>","C":"<texto>","D":"<texto>","E":"<texto>"}}]}

Campos obrigatórios por questão: id, text (≥20 chars), correctCount (1–3), publicExamName, examBoardName, subject, difficulty (easy/medium/hard), options (A–E não vazias).`;
}

function buildPrompt(scenario: Scenario): string {
  if (scenario.type === 'certification') {
    return buildCertificationPrompt(scenario.promptInput);
  }
  return buildPublicExamPrompt(scenario.promptInput);
}

// ── OpenAI call (mirrors openAI.service.ts exactly) ───────────────────────────
async function callOpenAI(
  prompt: string,
  openAIClient: OpenAI
): Promise<{ text: string; inputTokens: number; outputTokens: number; latencyMs: number }> {
  const model = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
  const start = Date.now();

  const response = await (openAIClient.responses.create as Function)({
    model,
    tools: [{ type: 'web_search_preview' }],
    input: prompt,
    max_output_tokens: 16000,
  });

  const latencyMs = Date.now() - start;

  return {
    text: response?.output_text ?? '',
    inputTokens: response?.usage?.input_tokens ?? 0,
    outputTokens: response?.usage?.output_tokens ?? 0,
    latencyMs,
  };
}

// ── Cost calculation ───────────────────────────────────────────────────────────
function computeCost(inputTokens: number, outputTokens: number) {
  const costUSD =
    (inputTokens / 1_000_000) * PRICING_USD.inputPerMillion +
    (outputTokens / 1_000_000) * PRICING_USD.outputPerMillion;
  return { costUSD, costBRL: costUSD * USD_TO_BRL };
}

// ── Parse generated questions ──────────────────────────────────────────────────
function parseFirstQuestion(text: string): { text: string; options: Record<string, string>; correctCount: number } | null {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const questions: unknown[] = parsed?.questions ?? [];
    if (!questions.length) return null;
    const q = questions[0] as Record<string, unknown>;
    return {
      text: String(q.text ?? ''),
      options: (q.options ?? {}) as Record<string, string>,
      correctCount: Number(q.correctCount ?? 1),
    };
  } catch {
    return null;
  }
}

// ── Run a single scenario ──────────────────────────────────────────────────────
async function runScenario(
  scenario: Scenario,
  openAIClient: OpenAI
): Promise<ScenarioResult> {
  console.log(`  Running: ${scenario.label}...`);

  try {
    const prompt = buildPrompt(scenario);
    const { text, inputTokens, outputTokens, latencyMs } = await callOpenAI(prompt, openAIClient);
    const { costUSD, costBRL } = computeCost(inputTokens, outputTokens);

    const firstQuestion = parseFirstQuestion(text);
    const questionsGenerated = (() => {
      try {
        const cleaned = text.replace(/```json|```/g, '').trim();
        return (JSON.parse(cleaned)?.questions ?? []).length;
      } catch {
        return 0;
      }
    })();

    let judgeScore: JudgeScore = { distractorQuality: 0, answerClarity: 0, technicalAccuracy: 0, difficulty: 0, overall: 0 };

    if (firstQuestion && firstQuestion.text) {
      console.log(`    Judging first question...`);
      judgeScore = await judgeQuestion(firstQuestion, scenario.label, openAIClient);
    } else {
      console.log(`    Warning: could not parse question for judging`);
    }

    const passed = judgeScore.overall >= PASS_MIN_JUDGE_SCORE && latencyMs <= PASS_MAX_LATENCY_MS;

    const statusIcon = passed ? '✓' : '✗';
    console.log(
      `    ${statusIcon} ${latencyMs}ms | ${inputTokens}in/${outputTokens}out | $${costUSD.toFixed(5)} | score ${judgeScore.overall.toFixed(1)}`
    );

    return {
      id: scenario.id,
      label: scenario.label,
      type: scenario.type,
      latencyMs,
      inputTokens,
      outputTokens,
      costUSD,
      costBRL,
      questionsGenerated,
      judgeScore,
      passed,
      generatedSample: firstQuestion?.text?.slice(0, 120) ?? '(parse failed)',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`    ✗ ERROR: ${message}`);
    return {
      id: scenario.id,
      label: scenario.label,
      type: scenario.type,
      latencyMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUSD: 0,
      costBRL: 0,
      questionsGenerated: 0,
      judgeScore: { distractorQuality: 0, answerClarity: 0, technicalAccuracy: 0, difficulty: 0, overall: 0 },
      passed: false,
      generatedSample: '',
      error: message,
    };
  }
}

// ── Save results ───────────────────────────────────────────────────────────────
function saveResults(report: BenchmarkReport): string {
  const resultsDir = path.join(__dirname, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });

  const ts = new Date().toISOString().replace(/:/g, '-').replace('T', '_').slice(0, 16);
  const modelSlug = report.model.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${ts}_${modelSlug}.json`;
  const filepath = path.join(resultsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  return filepath;
}

// ── Compare two result files ───────────────────────────────────────────────────
function compareReports(pathA: string, pathB: string): void {
  const a = JSON.parse(fs.readFileSync(pathA, 'utf-8')) as BenchmarkReport;
  const b = JSON.parse(fs.readFileSync(pathB, 'utf-8')) as BenchmarkReport;

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Comparison: ${a.model}  vs  ${b.model}`);
  console.log(`${'═'.repeat(70)}`);

  const headers = ['Metric', a.model, b.model, 'Δ (B vs A)'];
  const rows: [string, string, string, string][] = [
    [
      'Total cost USD',
      `$${a.summary.totalCostUSD.toFixed(5)}`,
      `$${b.summary.totalCostUSD.toFixed(5)}`,
      `${((b.summary.totalCostUSD - a.summary.totalCostUSD) / a.summary.totalCostUSD * 100).toFixed(1)}%`,
    ],
    [
      'Total cost BRL',
      `R$${a.summary.totalCostBRL.toFixed(4)}`,
      `R$${b.summary.totalCostBRL.toFixed(4)}`,
      `${((b.summary.totalCostBRL - a.summary.totalCostBRL) / a.summary.totalCostBRL * 100).toFixed(1)}%`,
    ],
    [
      'Avg latency',
      `${a.summary.avgLatencyMs}ms`,
      `${b.summary.avgLatencyMs}ms`,
      `${((b.summary.avgLatencyMs - a.summary.avgLatencyMs) / a.summary.avgLatencyMs * 100).toFixed(1)}%`,
    ],
    [
      'Avg quality score',
      a.summary.avgOverallScore.toFixed(2),
      b.summary.avgOverallScore.toFixed(2),
      `${(b.summary.avgOverallScore - a.summary.avgOverallScore).toFixed(2)} pts`,
    ],
    [
      'Passed',
      `${a.summary.scenariosPassed}/${a.summary.scenariosTotal}`,
      `${b.summary.scenariosPassed}/${b.summary.scenariosTotal}`,
      '',
    ],
  ];

  const colW = [28, 20, 20, 14];
  const fmt = (row: string[]) => row.map((v, i) => v.padEnd(colW[i])).join('  ');
  console.log(fmt(headers));
  console.log('-'.repeat(86));
  rows.forEach(row => console.log(fmt(row)));

  console.log(`\nPer-scenario quality:`);
  console.log(fmt(['Scenario', `${a.model.slice(0, 18)} score`, `${b.model.slice(0, 18)} score`, 'Δ']));
  console.log('-'.repeat(86));

  for (const sa of a.scenarios) {
    const sb = b.scenarios.find(s => s.id === sa.id);
    if (!sb) continue;
    const delta = sb.judgeScore.overall - sa.judgeScore.overall;
    console.log(fmt([
      sa.label.slice(0, 28),
      sa.judgeScore.overall.toFixed(2),
      sb.judgeScore.overall.toFixed(2),
      `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`,
    ]));
  }
  console.log('');
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  // --compare mode
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

  // Validate env
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set');
    process.exit(1);
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';

  // --scenario filter
  const scenarioIdx = args.indexOf('--scenario');
  const scenarioFilter = scenarioIdx !== -1 ? args[scenarioIdx + 1] : null;
  const scenariosToRun = scenarioFilter
    ? SCENARIOS.filter(s => s.id === scenarioFilter)
    : SCENARIOS;

  if (!scenariosToRun.length) {
    console.error(`Error: no scenario found with id "${scenarioFilter}"`);
    console.error(`Available: ${SCENARIOS.map(s => s.id).join(', ')}`);
    process.exit(1);
  }

  const openAIClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 280_000,
    maxRetries: 0,
  });

  console.log(`\nModel Eval Benchmark`);
  console.log(`Model under test : ${model}`);
  console.log(`Judge model      : gpt-5.6-sol`);
  console.log(`Scenarios        : ${scenariosToRun.length}`);
  console.log(`Pricing          : $${PRICING_USD.inputPerMillion}/M input · $${PRICING_USD.outputPerMillion}/M output`);
  console.log(`Pass threshold   : score >= ${PASS_MIN_JUDGE_SCORE} AND latency <= ${PASS_MAX_LATENCY_MS}ms`);
  console.log(`${'─'.repeat(60)}\n`);

  const results: ScenarioResult[] = [];

  for (const scenario of scenariosToRun) {
    const result = await runScenario(scenario, openAIClient);
    results.push(result);
  }

  // Summary
  const totalCostUSD = results.reduce((s, r) => s + r.costUSD, 0);
  const totalCostBRL = results.reduce((s, r) => s + r.costBRL, 0);
  const avgLatencyMs = Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / results.length);
  const avgOverallScore = results.reduce((s, r) => s + r.judgeScore.overall, 0) / results.length;
  const scenariosPassed = results.filter(r => r.passed).length;
  const passed = scenariosPassed === results.length;

  const report: BenchmarkReport = {
    model,
    timestamp: new Date().toISOString(),
    pricingUSD: PRICING_USD,
    summary: {
      totalCostUSD,
      totalCostBRL,
      avgLatencyMs,
      avgOverallScore: Math.round(avgOverallScore * 100) / 100,
      scenariosPassed,
      scenariosTotal: results.length,
      passed,
    },
    scenarios: results,
  };

  const filepath = saveResults(report);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`SUMMARY — ${model}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`Total cost      : $${totalCostUSD.toFixed(5)} USD / R$${totalCostBRL.toFixed(4)} BRL`);
  console.log(`Avg latency     : ${avgLatencyMs}ms`);
  console.log(`Avg quality     : ${avgOverallScore.toFixed(2)}/10`);
  console.log(`Passed          : ${scenariosPassed}/${results.length} scenarios`);
  console.log(`Overall result  : ${passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`\nResults saved   : ${filepath}`);
  console.log('');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
