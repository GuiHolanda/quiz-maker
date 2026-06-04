import OpenAI from 'openai';
import { PublicExam } from '@/shared/types';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export class EditalExtractorService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  validateFile(file: File): void {
    if (file.type !== 'application/pdf') {
      throw Object.assign(new Error('Only PDF files are allowed'), { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw Object.assign(new Error('File size cannot exceed 20MB'), { status: 413 });
    }
  }

  async extract(file: File, role?: string): Promise<PublicExam> {
    const uploadedFile = await this.openai.files.create({
      file,
      purpose: 'user_data',
    });

    try {
      const roleInstruction = role
        ? `The user is looking for the role/position: "${role}". Extract data specifically for this role if the edital covers multiple roles.`
        : 'Extract the main role/position mentioned in the edital, if any.';

      const response = await this.openai.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
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
                text: `You are extracting structured data from a Brazilian public exam notice (edital de concurso público).

${roleInstruction}

Return ONLY a valid JSON object with this exact shape — no markdown, no extra text:
{
  "name": "string (concurso name, e.g. 'Concurso Público TRF 2024')",
  "role": "string or null (cargo/role, e.g. 'Analista Judiciário')",
  "year": number or null,
  "examBoard": {
    "name": "string (banca organizadora, e.g. 'CESPE', 'FCC', 'VUNESP')",
    "fullName": "string or null (full banca name if available)"
  },
  "subjects": [
    {
      "name": "string (subject/discipline name)",
      "minQuestions": number (percentage 0-100),
      "maxQuestions": number (percentage 0-100),
      "topics": [
        { "name": "string (topic name)" }
      ]
    }
  ]
}

Rules for minQuestions/maxQuestions:
- These are PERCENTAGES (0-100), not absolute question counts.
- If the edital specifies question counts per subject, convert to percentage: (subjectQuestions / totalQuestions) * 100, rounded to nearest integer.
- If the edital does not specify distribution, divide equally: 100 / numberOfSubjects for each subject (minQuestions = maxQuestions = equal share).
- The sum of all maxQuestions values should equal 100.

Extract all subjects and their topics. Be thorough with topics — include every topic listed for each subject.`,
              },
            ],
          },
        ],
      });

      const text = response.output_text?.trim() ?? '';
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw Object.assign(new Error('AI returned invalid JSON'), { status: 502 });
      }

      return this.validateExtracted(parsed);
    } finally {
      await this.openai.files.delete(uploadedFile.id).catch(() => {
        // Cleanup failure is non-fatal
      });
    }
  }

  private validateExtracted(data: unknown): PublicExam {
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
    if (!Array.isArray(d.subjects) || d.subjects.length === 0) {
      throw Object.assign(new Error('Extracted data missing required field: subjects'), { status: 502 });
    }
    return data as PublicExam;
  }
}
