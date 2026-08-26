import type { PromptDefinition } from '../types';

export interface EditalExtractInput {
  readonly role?: string;
}

// Moved out of EditalExtractorService so it follows the same PromptDefinition<TInput>
// contract as every other prompt in the codebase — it used to be the one inline template
// string left in a service file. The call site still can't go through OpenAIService.call()
// (it needs input_file, which that helper doesn't expose), so this only supplies the text;
// EditalExtractorService.extract() builds the input_file content part around it.
export const editalExtractPrompt = {
  build: (input: EditalExtractInput): string => {
    const { role } = input;
    const roleInstruction = role
      ? `O usuário busca o cargo: "${role}". Extraia dados EXCLUSIVAMENTE para este cargo. Ignore todos os outros cargos presentes no edital.`
      : 'Extraia dados do cargo principal mencionado no edital, se houver apenas um.';

    return `Você é um especialista em extração de dados de editais de concursos públicos brasileiros.

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
}`;
  },
} satisfies PromptDefinition<EditalExtractInput>;
