import OpenAI from 'openai';

import type { BlueprintConfidence, Exam, ExamSection, ExamType } from '@/shared/types';
import { MetricsService } from '@/features/services/billing/metrics.service';
import { editalExtractPrompt, editalVerifyPrompt } from '@/config/prompts';
import type { EditalVerifyInput } from '@/config/prompts';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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

export class EditalExtractorService {
  // Lazy-init (see app/api/CLAUDE.md): auto-config-job.service.ts now constructs this
  // service too, and its own unit tests instantiate the whole module without an
  // OPENAI_API_KEY — eager `new OpenAI()` in the constructor would throw there.
  private _openai: OpenAI | null = null;
  private get openai(): OpenAI {
    this._openai ??= new OpenAI();
    return this._openai;
  }
  private readonly metricsService: MetricsService;

  constructor() {
    this.metricsService = new MetricsService();
  }

  validateFile(file: File): void {
    if (file.type !== 'application/pdf') {
      throw Object.assign(new Error('Only PDF files are allowed'), { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw Object.assign(new Error('File size cannot exceed 20MB'), { status: 413 });
    }
  }

  // opts.logId — when this runs as a stage of the auto-config pipeline (the located-edital
  // branch of runAutoConfigJob), it writes its step under the job's own UsageLog instead of
  // creating a second one. The manual-upload call site (extract-from-edital/route.ts) still
  // omits it and gets its own log, same as before.
  async extract(userId: string, file: File, role?: string, opts?: { logId?: string }): Promise<Exam> {
    const ownsLog = !opts?.logId;
    const logId = opts?.logId ?? (await this.metricsService.createLog(userId, 'extract_edital'));
    const startMs = Date.now();

    const uploadedFile = await this.openai.files.create({
      file,
      purpose: 'user_data',
    });

    let metricsFinalized = false;
    try {
      const response = await this.openai.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                file_id: uploadedFile.id,
              },
              {
                type: 'input_text',
                text: editalExtractPrompt.build({ role }),
              },
            ],
          },
        ],
      });

      const durationMs = Date.now() - startMs;
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;

      void this.metricsService.recordStep(logId, 'extract', { inputTokens, outputTokens }, durationMs);
      if (ownsLog) {
        await this.metricsService.finalize(logId, durationMs);
        metricsFinalized = true;
      }

      const raw = response.output_text?.trim() ?? '';
      const text = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      let parsed: unknown;

      try {
        parsed = JSON.parse(text);
      } catch {
        throw Object.assign(new Error('AI returned invalid JSON'), { status: 502 });
      }

      return this.validateExtracted(parsed);
    } catch (err) {
      if (ownsLog && !metricsFinalized) {
        await this.metricsService.finalize(logId, Date.now() - startMs);
      }
      throw err;
    } finally {
      await this.openai.files.delete(uploadedFile.id).catch(() => {
        // Cleanup failure is non-fatal
      });
    }
  }

  // Runs inside locateEdital's verification loop (auto-config-job.service.ts) — one call per
  // downloaded candidate, asking a narrow yes/no question instead of full extraction. Never
  // throws on a content problem (malformed JSON, empty response): those come back as
  // isMainEdital: false so the caller demotes the candidate instead of failing the whole
  // locate round. Network/SDK errors from responses.create still propagate — the caller
  // treats those as 'unreadable', same bucket as a fetchEditalPdf failure.
  async verifyIsMainEdital(
    file: File,
    input: EditalVerifyInput,
    opts: { logId: string }
  ): Promise<{ isMainEdital: boolean; documentType: string; year: number | null; editalNumber: string | null }> {
    const startMs = Date.now();
    const uploadedFile = await this.openai.files.create({
      file,
      purpose: 'user_data',
    });

    try {
      const response = await this.openai.responses.create({
        model: process.env.OPENAI_MODEL_VERIFY || process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                file_id: uploadedFile.id,
              },
              {
                type: 'input_text',
                text: editalVerifyPrompt.build(input),
              },
            ],
          },
        ],
      });

      const durationMs = Date.now() - startMs;
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;

      void this.metricsService.recordStep(opts.logId, 'verify_edital', { inputTokens, outputTokens }, durationMs);

      const raw = response.output_text?.trim() ?? '';
      const text = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        return {
          isMainEdital: parsed.isMainEdital === true,
          documentType: typeof parsed.documentType === 'string' ? parsed.documentType : 'outro',
          year: typeof parsed.year === 'number' ? parsed.year : null,
          editalNumber:
            typeof parsed.editalNumber === 'string' && parsed.editalNumber.trim() ? parsed.editalNumber.trim() : null,
        };
      } catch {
        // Unparseable content is not a network/SDK failure — treat as "not confirmed" rather
        // than propagating, so the caller demotes the candidate instead of aborting the round.
        return { isMainEdital: false, documentType: 'outro', year: null, editalNumber: null };
      }
    } finally {
      await this.openai.files.delete(uploadedFile.id).catch(() => {
        // Cleanup failure is non-fatal
      });
    }
  }

  private validateExtracted(data: unknown): Exam {
    if (!data || typeof data !== 'object') {
      throw Object.assign(new Error('Extracted data is not an object'), { status: 502 });
    }
    const d = data as Record<string, unknown>;

    if (typeof d.name !== 'string' || !d.name) {
      throw Object.assign(new Error('Extracted data missing required field: name'), { status: 502 });
    }
    if (!d.examBoard || typeof d.examBoard !== 'object') {
      throw Object.assign(new Error('Extracted data missing required field: examBoard'), { status: 502 });
    }
    const board = d.examBoard as Record<string, unknown>;

    if (typeof board.name !== 'string' || !board.name) {
      throw Object.assign(new Error('Extracted data missing required field: examBoard.name'), { status: 502 });
    }
    if (!Array.isArray(d.subjects)) {
      throw Object.assign(new Error('Extracted data missing required field: subjects'), { status: 502 });
    }

    return {
      type: 'public_exam',
      name: normalizeCase(d.name),
      key: typeof d.key === 'string' && d.key.trim() ? d.key.trim() : null,
      role: typeof d.role === 'string' ? normalizeCase(d.role) : null,
      year: typeof d.year === 'number' ? d.year : null,
      totalQuestions: typeof d.totalQuestions === 'number' && d.totalQuestions > 0 ? d.totalQuestions : 0,
      examDurationMinutes:
        typeof d.examDurationMinutes === 'number' && d.examDurationMinutes > 0 ? d.examDurationMinutes : null,
      passingScore:
        typeof d.passingScore === 'number' && d.passingScore >= 0 && d.passingScore <= 100 ? d.passingScore : null,
      examBoard: {
        name: board.name as string,
        fullName: typeof board.fullName === 'string' ? board.fullName : null,
      },
      sections: (d.subjects as Record<string, unknown>[]).map((s) => ({
        name: typeof s.name === 'string' ? normalizeCase(stripNumbering(s.name)) : String(s.name),
        minQuestions: typeof s.minQuestions === 'number' ? s.minQuestions : 0,
        maxQuestions: typeof s.maxQuestions === 'number' ? s.maxQuestions : 0,
        topics: Array.isArray(s.topics)
          ? (s.topics as Record<string, unknown>[]).flatMap((t) => {
              if (typeof t.name !== 'string') return [];
              return splitTopics(t.name).map((name) => ({ name }));
            })
          : [],
      })) as Exam['sections'],
    };
  }
}
