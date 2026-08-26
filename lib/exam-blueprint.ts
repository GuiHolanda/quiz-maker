import type { BlueprintConfidence, Exam, ExamSection, ExamType } from '@/shared/types';

// Moved out of EditalExtractorService so the auto-config pipeline's format stage can apply
// the same name cleanup to topics/subtopics harvested from a PDF edital or from web research.
export function normalizeCase(str: string): string {
  const letters = str.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '');
  if (letters.length === 0) return str;
  const isAllUpperCase = letters === letters.toUpperCase() && letters !== letters.toLowerCase();
  if (!isAllUpperCase) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function stripNumbering(str: string): string {
  // Remove leading numbering patterns: "1.", "1.1.", "1.1.2.", "a)", "I -", "I.", etc.
  return str.replace(/^[\d]+(?:\.[\d]+)*\.?\s*|^[a-zA-Z]\)\s*|^[IVXivx]+[\s.-]+/, '').trim();
}

export function splitTopics(name: string): string[] {
  // If a topic name contains semicolons, split into separate topics
  const parts = name
    .split(';')
    .map((p) => normalizeCase(stripNumbering(p.trim())))
    .filter(Boolean);
  return parts.length > 1 ? parts : [normalizeCase(stripNumbering(name))];
}

export interface ExamBlueprintTopic {
  readonly name: string;
  readonly minQuestions: number;
  readonly maxQuestions: number;
  readonly subtopics?: readonly string[];
}

export interface ExamBlueprintExam {
  readonly label: string;
  readonly key?: string | null;
  readonly provider?: string | null;
  readonly examBoard?: string | null;
  readonly role?: string | null;
  readonly totalQuestions?: number;
  readonly examDurationMinutes?: number;
  readonly passingScore?: number;
  readonly year?: number;
  readonly topics: readonly ExamBlueprintTopic[];
}

export interface ExamBlueprintPayload {
  readonly context?: string;
  readonly sources?: readonly string[];
  readonly exam: ExamBlueprintExam;
}

export interface ParsedExamBlueprint {
  readonly examDraft: Exam;
  readonly context: string;
  readonly sources: string[];
  // public_exam only — how the data was sourced (read straight from the edital PDF vs.
  // estimated from web research without it). Set by the caller, not derived here: this
  // function only knows the JSON shape, not which pipeline branch produced it.
  readonly confidence?: BlueprintConfidence;
}

// Validates and maps the JSON the auto-config "format" stage emits — the same contract for
// both certification and public_exam, with provider/examBoard/role read generically and left
// null where the domain doesn't apply. Throws Object.assign(new Error(msg), { status: 502 })
// on any structural problem, matching EditalExtractorService.validateExtracted.
export function validateExamBlueprint(data: unknown, type: ExamType): ParsedExamBlueprint {
  if (!data || typeof data !== 'object') {
    throw Object.assign(new Error('Blueprint data is not an object'), { status: 502 });
  }
  const payload = data as Record<string, unknown>;
  const examRaw = payload.exam;

  if (!examRaw || typeof examRaw !== 'object') {
    throw Object.assign(new Error('Blueprint missing required field: exam'), { status: 502 });
  }
  const exam = examRaw as Record<string, unknown>;

  if (typeof exam.label !== 'string' || !exam.label.trim()) {
    throw Object.assign(new Error('Blueprint missing required field: exam.label'), { status: 502 });
  }
  if (!Array.isArray(exam.topics) || exam.topics.length === 0) {
    throw Object.assign(new Error('Blueprint missing required field: exam.topics'), { status: 502 });
  }

  const sections: ExamSection[] = (exam.topics as Record<string, unknown>[]).map((topic) => {
    if (typeof topic.name !== 'string' || !topic.name.trim()) {
      throw Object.assign(new Error('Blueprint topic missing required field: name'), { status: 502 });
    }
    if (typeof topic.minQuestions !== 'number' || typeof topic.maxQuestions !== 'number') {
      throw Object.assign(new Error(`Blueprint topic "${topic.name}" missing minQuestions/maxQuestions`), {
        status: 502,
      });
    }

    return {
      name: normalizeCase(stripNumbering(topic.name)),
      minQuestions: topic.minQuestions,
      maxQuestions: topic.maxQuestions,
      topics: Array.isArray(topic.subtopics)
        ? (topic.subtopics as unknown[])
            .filter((name): name is string => typeof name === 'string' && name.trim() !== '')
            .flatMap((name) => splitTopics(name))
            .map((name) => ({ name }))
        : [],
    };
  });

  const examDraft: Exam = {
    type,
    name: exam.label.trim(),
    key: typeof exam.key === 'string' && exam.key.trim() ? exam.key.trim() : null,
    role: typeof exam.role === 'string' && exam.role.trim() ? normalizeCase(exam.role.trim()) : null,
    year: typeof exam.year === 'number' ? exam.year : null,
    totalQuestions: typeof exam.totalQuestions === 'number' && exam.totalQuestions > 0 ? exam.totalQuestions : 0,
    examDurationMinutes:
      typeof exam.examDurationMinutes === 'number' && exam.examDurationMinutes > 0 ? exam.examDurationMinutes : null,
    passingScore:
      typeof exam.passingScore === 'number' && exam.passingScore >= 0 && exam.passingScore <= 100
        ? exam.passingScore
        : null,
    provider: typeof exam.provider === 'string' && exam.provider.trim() ? { name: exam.provider.trim() } : null,
    examBoard: typeof exam.examBoard === 'string' && exam.examBoard.trim() ? { name: exam.examBoard.trim() } : null,
    sections,
  };

  return {
    examDraft,
    context: typeof payload.context === 'string' ? payload.context : '',
    sources: Array.isArray(payload.sources)
      ? (payload.sources as unknown[]).filter((s): s is string => typeof s === 'string')
      : [],
  };
}
