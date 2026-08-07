import OpenAI from 'openai';

import { Exam } from '@/shared/types';
import { MetricsService } from '@/features/services/metrics.service';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export class EditalExtractorService {
  private readonly openai: OpenAI;
  private readonly metricsService: MetricsService;

  constructor() {
    this.openai = new OpenAI();
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

  async extract(userId: string, file: File, role?: string): Promise<Exam> {
    const logId = await this.metricsService.createLog(userId, 'extract_edital');
    const startMs = Date.now();

    const uploadedFile = await this.openai.files.create({
      file,
      purpose: 'user_data',
    });

    let metricsFinalized = false;
    try {
      const roleInstruction = role
        ? `O usuário busca o cargo: "${role}". Extraia dados EXCLUSIVAMENTE para este cargo. Ignore todos os outros cargos presentes no edital.`
        : 'Extraia dados do cargo principal mencionado no edital, se houver apenas um.';

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
                text: `Você é um especialista em extração de dados de editais de concursos públicos brasileiros.

${roleInstruction}

TAREFA PRINCIPAL: Localize a seção de Conteúdo Programático (também chamada de Programa de Provas, Conteúdo das Provas, Anexo de Conteúdo ou similar) do edital. Esta seção contém as matérias (disciplinas) e os tópicos/assuntos que serão cobrados em cada prova para o cargo em questão.

INSTRUÇÕES:
1. Leia o edital completo e identifique a seção de conteúdo programático.
2. Para o cargo especificado, extraia TODAS as disciplinas individuais e TODOS os tópicos de cada disciplina — não resuma, não omita, não invente.
   - "Disciplina" significa uma matéria individual como "Língua Portuguesa", "Raciocínio Lógico", "Contabilidade Geral". NÃO é o nome de um grupo ou bloco de prova como "Conhecimentos Gerais", "Conhecimentos Específicos" ou "Prova I".
   - Se o edital organizar as disciplinas em grupos de prova (ex: "BLOCO I — Conhecimentos Gerais" contendo Língua Portuguesa, Raciocínio Lógico, etc.), ignore os nomes dos grupos e crie um objeto "subject" separado para CADA disciplina individual.
   - NUNCA crie um subject com o nome de um grupo/bloco de prova. SEMPRE achate: cada disciplina vira um subject independente.
3. Se o edital apresentar provas separadas (ex: Prova Objetiva, Prova Discursiva, Prova de Títulos), inclua apenas as matérias da prova objetiva. Se não houver distinção, inclua todas.
4. Para minQuestions e maxQuestions: se o edital informar a quantidade de questões por disciplina, converta para percentual do total (ex: 10 de 50 questões = 20%). Se o edital informar percentuais ou questões por GRUPO de prova (não por disciplina), divida o percentual do grupo igualmente entre as disciplinas que o compõem. Se não informar nenhuma distribuição, distribua igualmente entre TODAS as disciplinas (100 / número total de disciplinas, arredondado). A soma de todos os maxQuestions deve ser exatamente 100 — use o método "largest remainder" para garantir isso (adicione 1 às disciplinas com maior resto fracionário até atingir 100).
5. Se o edital informar o número total de questões da prova objetiva, registre em totalQuestions (inteiro).
6. Se o edital informar a duração da prova, registre em examDurationMinutes (inteiro em minutos, ex: 4 horas = 240).
7. Se o edital informar a nota mínima de aprovação, registre em passingScore como percentual 0–100 (ex: 72.0 para 72%). Se expressa em nota absoluta (ex: 56 de 80), converta para percentual.
8. Se qualquer desses campos não constar no edital, omita-o do JSON.

EXEMPLO DE ACHATAMENTO OBRIGATÓRIO:
Se o edital apresentar:
  PROVA I — Conhecimentos Gerais (50%)
    - Língua Portuguesa
    - Raciocínio Lógico
    - História de Campina Grande/PB
    - Legislação e Ética no Serviço Público
  PROVA II — Conhecimentos Específicos de Enfermeiro do Trabalho (50%)
    - tópico A; tópico B; tópico C

O JSON correto deve ter 5 subjects (não 2):
  - "Língua Portuguesa" com minQuestions/maxQuestions = 13 (50% ÷ 4 arredondado)
  - "Raciocínio Lógico" com minQuestions/maxQuestions = 13
  - "História de Campina Grande/PB" com minQuestions/maxQuestions = 12
  - "Legislação e Ética no Serviço Público" com minQuestions/maxQuestions = 12
  - "Conhecimentos Específicos de Enfermeiro do Trabalho" com minQuestions/maxQuestions = 50
  (13+13+12+12+50 = 100 ✓)
ERRADO seria retornar "Conhecimentos Gerais" como subject com as 4 disciplinas como tópicos.

REGRAS PARA NOMES DE MATÉRIAS E TÓPICOS:
- Remova qualquer prefixo de numeração dos nomes (ex: "1.", "1.1.", "2.", "a)", "I -" → não inclua no nome).
- Cada tópico deve ser um item separado no array. Se o edital listar múltiplos assuntos separados por ponto e vírgula (";") dentro de um mesmo item numerado, crie um objeto de tópico separado para cada assunto.
- O nome do tópico deve conter apenas o conteúdo, sem numeração.
- Nomes de disciplinas genéricos como "Conhecimentos Específicos", "Conhecimentos Técnicos", "Conhecimentos Profissionais" ou similares devem ser qualificados com o nome do cargo ou área. Ex: se o cargo é "Enfermeiro do Trabalho", use "Conhecimentos Específicos de Enfermeiro do Trabalho". Se o cargo é "Analista de TI", use "Conhecimentos Específicos de Analista de TI".

Retorne APENAS um objeto JSON válido com a estrutura abaixo — sem markdown, sem texto extra, sem comentários:
{
  "name": "string (nome do concurso identificando apenas o órgão/entidade e o ano, sem incluir o cargo — o cargo vai em 'role'. Ex: 'Concurso Público TRF 1ª Região 2024', 'Concurso Público Prefeitura Municipal de Campina Grande 2024')",
  "key": "string ou null (número do edital, ex: '001/2025', '002/2024-SUSAM'. Se não constar no edital, retorne null)",
  "role": "string ou null (nome exato do cargo conforme o edital, ex: 'Analista Judiciário — Área Judiciária')",
  "year": number ou null,
  "totalQuestions": number ou null (total de questões da prova objetiva, se informado),
  "examDurationMinutes": number ou null (duração em minutos, se informado),
  "passingScore": number ou null (nota mínima como percentual 0–100, se informado),
  "examBoard": {
    "name": "string (sigla da banca, ex: 'CESPE', 'FCC', 'VUNESP', 'CESGRANRIO')",
    "fullName": "string ou null (nome completo da banca se disponível)"
  },
  "subjects": [
    {
      "name": "string (nome da disciplina individual — nunca um grupo/bloco de prova, sem prefixo de numeração)",
      "minQuestions": number (percentual 0-100),
      "maxQuestions": number (percentual 0-100),
      "topics": [
        { "name": "string (um único tópico/assunto, sem numeração, sem ponto e vírgula separando múltiplos assuntos)" }
      ]
    }
  ]
}`,
              },
            ],
          },
        ],
      });

      const durationMs = Date.now() - startMs;
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;

      void this.metricsService.recordStep(logId, 'extract', { inputTokens, outputTokens }, durationMs);
      await this.metricsService.finalize(logId, durationMs);
      metricsFinalized = true;

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
      if (!metricsFinalized) {
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
      name: this.normalizeCase(d.name),
      key: typeof d.key === 'string' && d.key.trim() ? d.key.trim() : null,
      role: typeof d.role === 'string' ? this.normalizeCase(d.role) : null,
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
        name: typeof s.name === 'string' ? this.normalizeCase(this.stripNumbering(s.name)) : String(s.name),
        minQuestions: typeof s.minQuestions === 'number' ? s.minQuestions : 0,
        maxQuestions: typeof s.maxQuestions === 'number' ? s.maxQuestions : 0,
        topics: Array.isArray(s.topics)
          ? (s.topics as Record<string, unknown>[]).flatMap((t) => {
              if (typeof t.name !== 'string') return [];
              return this.splitTopics(t.name).map((name) => ({ name }));
            })
          : [],
      })) as Exam['sections'],
    };
  }

  private normalizeCase(str: string): string {
    const letters = str.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '');
    if (letters.length === 0) return str;
    const isAllUpperCase = letters === letters.toUpperCase() && letters !== letters.toLowerCase();
    if (!isAllUpperCase) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private stripNumbering(str: string): string {
    // Remove leading numbering patterns: "1.", "1.1.", "1.1.2.", "a)", "I -", "I.", etc.
    return str.replace(/^[\d]+(?:\.[\d]+)*\.?\s*|^[a-zA-Z]\)\s*|^[IVXivx]+[\s.-]+/, '').trim();
  }

  private splitTopics(name: string): string[] {
    // If a topic name contains semicolons, split into separate topics
    const parts = name
      .split(';')
      .map((p) => this.normalizeCase(this.stripNumbering(p.trim())))
      .filter(Boolean);
    return parts.length > 1 ? parts : [this.normalizeCase(this.stripNumbering(name))];
  }
}
