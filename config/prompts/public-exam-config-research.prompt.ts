import type { PromptDefinition } from './types';

export interface PublicExamConfigResearchInput {
  readonly public_exam_name: string;
  readonly role?: string | null;
  readonly exam_board_name?: string | null;
  readonly year?: number | null;
}

export const publicExamConfigResearchPrompt = {
  build: (input: PublicExamConfigResearchInput): string => {
    const { public_exam_name, role, exam_board_name, year } = input;
    const hints = [
      role ? `Cargo pretendido: ${role}.` : '',
      exam_board_name ? `Banca organizadora: ${exam_board_name}.` : '',
      year ? `Ano do edital: ${year}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `Você é um especialista em concursos públicos brasileiros.

## TAREFA

Pesquise na web o conteúdo programático oficial (edital) do concurso "${public_exam_name}". ${hints}

Procure especificamente:
- A lista de disciplinas (matérias) individuais cobradas na prova objetiva para o cargo, com sua distribuição de questões ou percentual, quando publicada.
- Os tópicos/assuntos de cada disciplina, conforme o edital.
- totalQuestions, examDurationMinutes e passingScore (nota mínima de aprovação) da prova objetiva.

## SAÍDA

Escreva os resultados em um bloco de texto estruturado. Não use JSON. Não adicione comentários antes ou depois.

EXAM
name: <nome do concurso, órgão + ano, sem incluir o cargo>
key: <número do edital, ou "-" se não encontrado>
examBoard: <sigla da banca>
role: <cargo pretendido, exatamente como no edital>
year: <ano do edital, ou "-">
totalQuestions: <inteiro, ou "-">
examDurationMinutes: <inteiro em minutos, ou "-">
passingScore: <percentual 0-100, ou "-">
context: <1-2 frases sobre o concurso>
sources: <até 2 fontes como "[Título](url)", separadas por " | ", ou "-">
---
SECTION
name: <nome da disciplina individual — nunca um grupo/bloco de prova>
minQuestions: <inteiro 0-100, percentual da disciplina>
maxQuestions: <inteiro 0-100>
subtopics: <tópicos separados por "; ", ou omita esta linha se não houver>
---
SECTION
...

## REGRAS

- Cada disciplina individual vira uma SECTION separada. Se o edital organizar disciplinas em blocos de prova (ex: "Conhecimentos Gerais" contendo Português, Raciocínio Lógico), NUNCA crie uma SECTION com o nome do bloco — sempre achate para uma SECTION por disciplina.
- Se o edital informar questões/percentual por bloco (não por disciplina), divida o percentual do bloco igualmente entre as disciplinas que o compõem.
- Se o edital não informar distribuição alguma, distribua igualmente entre todas as disciplinas.
- A soma de todos os maxQuestions deve ser aproximadamente 100.
- Remova qualquer prefixo de numeração dos nomes de disciplina/tópico (ex: "1.", "1.1.", "a)", "I -").
- Nomes genéricos como "Conhecimentos Específicos" devem ser qualificados com o cargo (ex: "Conhecimentos Específicos de Analista Judiciário").
- Use APENAS informações do edital oficial ou de fontes oficiais do órgão/banca. Nunca invente disciplinas ou percentuais.
- Se não encontrar o edital oficial, escreva sua melhor estimativa com base em concursos semelhantes e registre essa ressalva no context.`;
  },
} satisfies PromptDefinition<PublicExamConfigResearchInput>;
