import OpenAI from 'openai';

import { Exam } from '@/shared/types';
import { MetricsService } from '@/features/services/metrics.service';
import { normalizeCase, splitTopics, stripNumbering } from '@/lib/exam-blueprint';
import { editalExtractPrompt } from '@/config/prompts';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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
