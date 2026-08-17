import { prisma, PrismaService } from '@/lib/prisma';
import { distributeByWeight } from '@/lib/largest-remainder';
import { DEMO_MIN_OPTIONS, DEMO_QUIZ_SIZE, DEMO_SLICE_MAX, DEMO_SLICE_MIN } from '@/config/constants';
import type { DemoCatalogExam, DemoQuestion } from '@/shared/types';

interface PoolQuestion {
  readonly id: number;
  readonly text: string;
  readonly options: ReadonlyArray<{ readonly label: string; readonly text: string }>;
  readonly answer: {
    readonly correctOptions: unknown;
    readonly explanations: ReadonlyArray<{ readonly label: string; readonly text: string }>;
  } | null;
}

interface DemoDomain {
  readonly name: string;
  readonly weight: number;
  readonly questions: readonly PoolQuestion[];
}

interface DemoExamSlice {
  readonly exam: DemoCatalogExam;
  readonly domains: ReadonlyArray<{ readonly name: string; readonly questions: readonly PoolQuestion[] }>;
}

function parseCorrectOptions(raw: unknown): string[] {
  const value = typeof raw === 'string' ? safeParse(raw) : raw;
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Single source of truth for eligibility. Prisma cannot filter by relation count
// in a `where`, so this runs in JS — and both the catalog count and the quiz
// selection must call it, or the catalog advertises questions the quiz cannot serve.
//
// The demo serves the pool as-is and never calls the LLM, so everything it needs
// must already be persisted: enough options, a gabarito to score against, and an
// explanation to show in the diagnosis.
export function isDemoEligible(question: PoolQuestion): boolean {
  if (question.options.length < DEMO_MIN_OPTIONS) return false;
  if (!question.answer) return false;

  const correctOptions = parseCorrectOptions(question.answer.correctOptions);
  if (correctOptions.length === 0) return false;

  const labels = new Set(question.options.map((option) => option.label));
  if (!correctOptions.every((label) => labels.has(label))) return false;

  const explainedLabels = new Set(question.answer.explanations.map((explanation) => explanation.label));
  return correctOptions.every((label) => explainedLabels.has(label));
}

function toDemoQuestion(question: PoolQuestion, topic: string): DemoQuestion {
  const options = [...question.options].sort((a, b) => a.label.localeCompare(b.label));
  const correctOptions = parseCorrectOptions(question.answer?.correctOptions);

  const correctIndexes = options
    .map((option, index) => (correctOptions.includes(option.label) ? index : -1))
    .filter((index) => index >= 0);

  const explanationByLabel = new Map(
    (question.answer?.explanations ?? []).map((explanation) => [explanation.label, explanation.text])
  );

  const explanation = correctOptions
    .map((label) => explanationByLabel.get(label))
    .filter((text): text is string => Boolean(text))
    .join(' ');

  return {
    text: question.text,
    options: options.map((option) => option.text),
    correctIndexes,
    topic,
    explanation,
  };
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export class DemoCatalogService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public async listDemoExams(): Promise<DemoCatalogExam[]> {
    const slices = await this.buildSlices();
    return slices.map((slice) => slice.exam);
  }

  public async buildQuiz(examId: string, alloc: Record<string, number>): Promise<DemoQuestion[]> {
    const slices = await this.buildSlices(examId);
    const slice = slices.find((entry) => entry.exam.id === examId);

    if (!slice) {
      throw Object.assign(new Error('Exame indisponível para a demonstração'), { status: 404 });
    }

    const requested = Object.entries(alloc).filter(([, count]) => count > 0);
    const requestedTotal = requested.reduce((sum, [, count]) => sum + count, 0);

    if (requestedTotal !== DEMO_QUIZ_SIZE) {
      throw Object.assign(new Error(`A distribuição deve somar ${DEMO_QUIZ_SIZE} questões`), { status: 400 });
    }

    const domainByName = new Map(slice.domains.map((domain) => [domain.name, domain]));
    const selected: DemoQuestion[] = [];

    for (const [name, count] of requested) {
      const domain = domainByName.get(name);

      if (!domain) {
        throw Object.assign(new Error(`Domínio desconhecido: ${name}`), { status: 400 });
      }

      if (!Number.isInteger(count) || count > domain.questions.length) {
        throw Object.assign(
          new Error(`O domínio "${name}" tem apenas ${domain.questions.length} questões disponíveis`),
          { status: 400 }
        );
      }

      shuffle(domain.questions)
        .slice(0, count)
        .forEach((question) => selected.push(toDemoQuestion(question, name)));
    }

    return shuffle(selected);
  }

  private async buildSlices(examId?: string): Promise<DemoExamSlice[]> {
    const templates = await this.prismaService.exam.findMany({
      where: { isTemplate: true, ...(examId ? { id: examId } : {}) },
      include: {
        provider: true,
        examBoard: true,
        sections: { orderBy: { name: 'asc' } },
      },
    });

    if (templates.length === 0) return [];

    const pools = await this.prismaService.questionPool.findMany({
      where: {
        OR: templates.map((template) => ({
          type: template.type,
          providerId: template.providerId,
          examBoardId: template.examBoardId,
        })),
      },
      include: {
        questions: {
          orderBy: { id: 'asc' },
          include: { options: true, answer: { include: { explanations: true } } },
        },
      },
    });

    const poolKey = (type: string, providerId: string | null, examBoardId: string | null, sectionName: string) =>
      `${type}|${providerId ?? ''}|${examBoardId ?? ''}|${sectionName}`;

    const questionsByKey = new Map<string, PoolQuestion[]>();

    for (const pool of pools) {
      const key = poolKey(pool.type, pool.providerId, pool.examBoardId, pool.sectionName);
      const eligible = pool.questions.filter(isDemoEligible);
      const existing = questionsByKey.get(key) ?? [];

      questionsByKey.set(key, [...existing, ...eligible]);
    }

    const slices: DemoExamSlice[] = [];

    for (const template of templates) {
      const domains: DemoDomain[] = template.sections.map((section) => ({
        name: section.name,
        weight: section.minQuestions,
        questions:
          questionsByKey.get(poolKey(template.type, template.providerId, template.examBoardId, section.name)) ?? [],
      }));

      const populated = domains.filter((domain) => domain.questions.length > 0);
      const totalAvailable = populated.reduce((sum, domain) => sum + domain.questions.length, 0);

      if (totalAvailable < DEMO_SLICE_MIN) continue;

      const sliceSize = Math.min(DEMO_SLICE_MAX, totalAvailable);
      const perDomain = distributeByWeight(
        populated.map((domain) => ({
          key: domain.name,
          weight: domain.weight,
          capacity: domain.questions.length,
        })),
        sliceSize
      );

      const sliceDomains = populated
        .map((domain) => ({ name: domain.name, questions: domain.questions.slice(0, perDomain[domain.name] ?? 0) }))
        .filter((domain) => domain.questions.length > 0);

      const poolSize = sliceDomains.reduce((sum, domain) => sum + domain.questions.length, 0);

      if (poolSize < DEMO_SLICE_MIN) continue;

      const provider = template.provider;
      const examBoard = template.examBoard;
      const owner = provider ?? examBoard;

      slices.push({
        exam: {
          id: template.id,
          name: template.name,
          mark: owner?.name.split(' ')[0] ?? template.name.slice(0, 4),
          vendor: owner?.fullName ?? owner?.name ?? '',
          logoUrl: owner?.logoUrl ?? null,
          year: template.year ? String(template.year) : '',
          questions: template.totalQuestions,
          minutes: template.examDurationMinutes ?? 0,
          passing: template.passingScore ? `${Math.round(template.passingScore)}%` : '',
          updatedAt: template.updatedAt.toISOString(),
          poolSize,
          domains: sliceDomains.map((domain) => {
            const source = populated.find((entry) => entry.name === domain.name);
            return {
              name: domain.name,
              weight: source?.weight ?? 0,
              available: domain.questions.length,
            };
          }),
        },
        domains: sliceDomains,
      });
    }

    return slices;
  }
}
