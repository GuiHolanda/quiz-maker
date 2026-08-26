// Hybrid scoring for edital-benchmark: deterministic assertions for fields that have exactly
// one correct value, plus an LLM judge only for topic coverage, where legitimate paraphrase
// makes a string-equality check produce false negatives. Mirrors the judge pattern in
// scripts/eval/judge.ts (temperature 0, forced JSON).

import type OpenAI from 'openai';

import type { Exam } from '../../shared/types';
import type { ExpectedEdital } from './edital-fixtures/expected';

// Section percentages are integers 0-100 (CLAUDE.md § Database). Exact division rarely lands
// on a whole number, and the extraction prompt's largest-remainder rounding can legitimately
// differ from the gabarito's own rounding by a point or two — this tolerance absorbs that
// without absorbing an actually-wrong distribution.
const SECTION_PERCENTAGE_TOLERANCE_PP = 3;

export interface FieldCheck {
  readonly field: string;
  readonly expected: string;
  readonly actual: string;
  readonly passed: boolean;
}

export interface DeterministicScore {
  readonly checks: readonly FieldCheck[];
  readonly passedCount: number;
  readonly totalCount: number;
  readonly score: number; // 0-1
}

function check(field: string, expected: string | number, actual: string | number, passed: boolean): FieldCheck {
  return { field, expected: String(expected), actual: String(actual), passed };
}

function normalizeForMatch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .trim();
}

// "key" values are free text ("04/2026", "Edital nº 04/2026", "04-2026.4"...) — comparing on
// digit sequences alone tolerates the extractor's exact formatting choice while still failing a
// genuinely wrong number.
function normalizeKey(s: string): string {
  return (s.match(/\d+/g) ?? []).join('/');
}

// Deterministic pass over the fields with exactly one correct value. Never scores topic
// wording — that's the judge's job. Section matching is by normalized name, tolerant of the
// extractor picking a slightly different but equivalent label (e.g. "Conhecimentos Específicos
// de Agente Administrativo" vs "Conhecimentos Específicos ao Cargo").
export function scoreDeterministic(expected: ExpectedEdital, actual: Exam): DeterministicScore {
  const checks: FieldCheck[] = [
    check('year', expected.year, actual.year ?? 'null', actual.year === expected.year),
    check('key', expected.key, actual.key ?? 'null', normalizeKey(actual.key ?? '') === normalizeKey(expected.key)),
    check(
      'examBoard.name',
      expected.examBoard,
      actual.examBoard?.name ?? 'null',
      normalizeForMatch(actual.examBoard?.name ?? '').includes(normalizeForMatch(expected.examBoard)) ||
        normalizeForMatch(expected.examBoard).includes(normalizeForMatch(actual.examBoard?.name ?? ''))
    ),
    check('totalQuestions', expected.totalQuestions, actual.totalQuestions, actual.totalQuestions === expected.totalQuestions),
    check(
      'examDurationMinutes',
      expected.examDurationMinutes,
      actual.examDurationMinutes ?? 'null',
      actual.examDurationMinutes === expected.examDurationMinutes
    ),
    check('passingScore', expected.passingScore, actual.passingScore ?? 'null', actual.passingScore === expected.passingScore),
    check('sectionCount', expected.sections.length, actual.sections.length, actual.sections.length === expected.sections.length),
  ];

  for (const expectedSection of expected.sections) {
    const actualSection = actual.sections.find((s) => {
      const a = normalizeForMatch(s.name);
      const e = normalizeForMatch(expectedSection.name);
      return a === e || a.includes(e) || e.includes(a);
    });

    if (!actualSection) {
      checks.push(check(`section["${expectedSection.name}"]`, `found @ ${expectedSection.percentage}%`, 'not found', false));
      continue;
    }

    const withinTolerance = Math.abs(actualSection.maxQuestions - expectedSection.percentage) <= SECTION_PERCENTAGE_TOLERANCE_PP;
    checks.push(
      check(`section["${expectedSection.name}"].percentage`, `${expectedSection.percentage}%`, `${actualSection.maxQuestions}%`, withinTolerance)
    );
  }

  const passedCount = checks.filter((c) => c.passed).length;
  return { checks, passedCount, totalCount: checks.length, score: checks.length ? passedCount / checks.length : 0 };
}

export interface TopicCoverageScore {
  readonly sectionName: string;
  readonly coveredCount: number;
  readonly totalCount: number;
  readonly score: number; // 0-1
  readonly reasoning: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

const JUDGE_MODEL = 'gpt-5.6-sol';

const TOPIC_COVERAGE_SYSTEM_PROMPT = `Você avalia se um extrator de editais de concurso capturou os tópicos corretos de uma disciplina. Você recebe uma lista de tópicos esperados (gabarito, extraído manualmente do PDF oficial) e a lista de tópicos que o extrator realmente devolveu.

Um tópico do gabarito conta como "coberto" quando existe um tópico extraído que é uma paráfrase legítima ou uma reorganização do mesmo conteúdo — não precisa ser texto idêntico. Um tópico do gabarito NÃO conta como coberto se está simplesmente ausente, ou se o que foi extraído é vago demais para representar o conteúdo específico (ex.: "Direito" não cobre "Concordância verbal e nominal").

Responda APENAS com um objeto JSON neste formato exato, sem texto antes ou depois:
{"coveredCount": 8, "totalCount": 10, "reasoning": "resumo em uma frase do que faltou, se algo faltou"}`;

// Judges topic coverage for a single section — one call per section, not per topic, since the
// judge needs the whole extracted list to find paraphrases across items.
export async function scoreTopicCoverage(
  sectionName: string,
  expectedTopics: readonly string[],
  actualTopics: readonly string[],
  openAIClient: OpenAI
): Promise<TopicCoverageScore> {
  const userMessage = `Disciplina: ${sectionName}

Tópicos esperados (gabarito):
${expectedTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Tópicos extraídos:
${actualTopics.length ? actualTopics.map((t, i) => `${i + 1}. ${t}`).join('\n') : '(nenhum)'}

Avalie a cobertura.`;

  const response = await openAIClient.chat.completions.create({
    model: JUDGE_MODEL,
    messages: [
      { role: 'system', content: TOPIC_COVERAGE_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    // gpt-5.6-sol (a reasoning-only model) rejects any temperature other than its default (1)
    // — confirmed live: "400 Unsupported value: 'temperature' does not support 0 with this
    // model." judge.ts had the same unexercised bug; fixed there too.
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as Partial<{ coveredCount: number; totalCount: number; reasoning: string }>;

  const totalCount = Number(parsed.totalCount ?? expectedTopics.length);
  const coveredCount = Math.min(Number(parsed.coveredCount ?? 0), totalCount);

  return {
    sectionName,
    coveredCount,
    totalCount,
    score: totalCount ? coveredCount / totalCount : 0,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  };
}

export interface ExtractionScore {
  readonly deterministic: DeterministicScore;
  readonly topicCoverage: readonly TopicCoverageScore[];
  readonly avgTopicCoverageScore: number;
  readonly overall: number; // 0-10, weighted: 60% deterministic, 40% topic coverage
  readonly passed: boolean;
}

const PASS_MIN_EXTRACTION_SCORE = 7.0;

export function combineExtractionScore(deterministic: DeterministicScore, topicCoverage: readonly TopicCoverageScore[]): ExtractionScore {
  const avgTopicCoverageScore = topicCoverage.length ? topicCoverage.reduce((sum, t) => sum + t.score, 0) / topicCoverage.length : 0;

  const overall = (deterministic.score * 0.6 + avgTopicCoverageScore * 0.4) * 10;

  return {
    deterministic,
    topicCoverage,
    avgTopicCoverageScore,
    overall,
    passed: overall >= PASS_MIN_EXTRACTION_SCORE,
  };
}

export interface IdentifyScore {
  readonly checks: readonly FieldCheck[];
  readonly score: number; // 0-1
}

// Scores identifyExam's best match — the seed that feeds into locateEdital in production (see
// useExamSeed.hook.ts). A wrong year/board here means locate starts from a bad seed even if it
// later recovers, so it's worth scoring on its own rather than folding silently into locate.
//
// The key check matters more than it looks: an employer can run multiple concurrent processos
// seletivos under the same name/board/year (e.g. Transpetro's PSP/MAR and PSP/TERRA, both
// "Transpetro 2026" with the same board and year but different edital numbers and disjoint role
// lists). year+board alone can't tell those apart — only the edital number can — so a fixture
// that specifies `key` gets that check too; one that doesn't (an unambiguous concurso) skips it
// rather than penalizing a paraphrased key format.
export function scoreIdentify(
  expected: ExpectedEdital,
  bestMatch: { readonly year: number | null; readonly examBoard: string | null; readonly key: string | null } | null
): IdentifyScore {
  const checks: FieldCheck[] = [
    check('foundMatch', 'true', String(bestMatch !== null), bestMatch !== null),
    check('year', expected.year, bestMatch?.year ?? 'null', bestMatch?.year === expected.year),
    check(
      'examBoard',
      expected.examBoard,
      bestMatch?.examBoard ?? 'null',
      normalizeForMatch(bestMatch?.examBoard ?? '').includes(normalizeForMatch(expected.examBoard)) ||
        normalizeForMatch(expected.examBoard).includes(normalizeForMatch(bestMatch?.examBoard ?? ''))
    ),
  ];

  if (expected.key) {
    checks.push(check('key', expected.key, bestMatch?.key ?? 'null', normalizeKey(bestMatch?.key ?? '') === normalizeKey(expected.key)));
  }

  const passedCount = checks.filter((c) => c.passed).length;
  return { checks, score: passedCount / checks.length };
}

export interface LocateScore {
  readonly foundConfirmed: boolean;
  readonly correctYear: boolean;
  readonly officialDomain: boolean;
  readonly checks: readonly FieldCheck[];
  readonly score: number; // 0-1
  readonly passed: boolean;
}

const PASS_MIN_LOCATE_SCORE = 0.8;

// Scores the locate stage against candidate PROPERTIES only — never against the exact URL,
// which rots as portals reorganize. See lib/edital-domains.ts for domainClass/isOfficialDomain.
export function scoreLocate(
  expected: ExpectedEdital,
  candidate: { readonly year: number | null; readonly verification: string; readonly isOfficialDomain: boolean; readonly url: string } | null
): LocateScore {
  const foundConfirmed = candidate?.verification === 'confirmed';
  const correctYear = candidate?.year === expected.year;
  const officialDomain = candidate ? expected.officialDomainSuffixes.some((suffix) => candidate.url.includes(suffix)) : false;

  const checks: FieldCheck[] = [
    check('foundCandidate', 'true', String(candidate !== null), candidate !== null),
    check('verification', 'confirmed', candidate?.verification ?? 'none', foundConfirmed),
    check('year', expected.year, candidate?.year ?? 'null', correctYear),
    check('officialDomain', 'true', String(officialDomain), officialDomain),
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = passedCount / checks.length;

  return { foundConfirmed, correctYear, officialDomain, checks, score, passed: score >= PASS_MIN_LOCATE_SCORE };
}
