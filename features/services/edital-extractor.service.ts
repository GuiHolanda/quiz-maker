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
        ? `O usuário busca o cargo: "${role}". Extraia dados EXCLUSIVAMENTE para este cargo. Ignore todos os outros cargos presentes no edital.`
        : 'Extraia dados do cargo principal mencionado no edital, se houver apenas um.';

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
                text: `Você é um especialista em extração de dados de editais de concursos públicos brasileiros.

${roleInstruction}

TAREFA PRINCIPAL: Localize a seção de Conteúdo Programático (também chamada de Programa de Provas, Conteúdo das Provas, Anexo de Conteúdo ou similar) do edital. Esta seção contém as matérias (disciplinas) e os tópicos/assuntos que serão cobrados em cada prova para o cargo em questão.

INSTRUÇÕES:
1. Leia o edital completo e identifique a seção de conteúdo programático.
2. Para o cargo especificado, extraia TODAS as matérias listadas e TODOS os tópicos de cada matéria exatamente como constam no edital — não resuma, não omita, não invente.
3. Se o edital apresentar provas separadas (ex: Prova Objetiva, Prova Discursiva, Prova de Títulos), inclua apenas as matérias da prova objetiva. Se não houver distinção, inclua todas.
4. Para minQuestions e maxQuestions: se o edital informar a quantidade de questões por matéria, converta para percentual do total (ex: 10 de 50 questões = 20%). Se não informar, distribua igualmente entre as matérias (100 / número de matérias, arredondado).
5. A soma de todos os maxQuestions deve ser igual a 100.

Retorne APENAS um objeto JSON válido com a estrutura abaixo — sem markdown, sem texto extra, sem comentários:
{
  "name": "string (nome completo do concurso, ex: 'Concurso Público TRF 1ª Região 2024')",
  "role": "string ou null (nome exato do cargo conforme o edital, ex: 'Analista Judiciário — Área Judiciária')",
  "year": number ou null,
  "examBoard": {
    "name": "string (sigla da banca, ex: 'CESPE', 'FCC', 'VUNESP', 'CESGRANRIO')",
    "fullName": "string ou null (nome completo da banca se disponível)"
  },
  "subjects": [
    {
      "name": "string (nome da matéria/disciplina exatamente como no edital)",
      "minQuestions": number (percentual 0-100),
      "maxQuestions": number (percentual 0-100),
      "topics": [
        { "name": "string (tópico exatamente como consta no edital)" }
      ]
    }
  ]
}`,
              },
            ],
          },
        ],
      });

      const raw = response.output_text?.trim() ?? '';
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
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
