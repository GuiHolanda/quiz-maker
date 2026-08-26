/**
 * One-off generator for the 10 exam landing pages beyond the original 6 — CFA Level I,
 * FRM Part I, CPA-10, CFP (PLANEJAR), AAI/ANCORD, CompTIA Security+, Cisco CCNA, Terraform
 * Associate, GCP Professional Cloud Architect, AWS Developer Associate.
 *
 * Facts (totalQuestions, examDurationMinutes, passingScore, topic weights) are hardcoded
 * below from prisma/dev/scripts/add-catalog-certs.ts — the same verified data already
 * backing the real catalog — never from the LLM. The LLM only writes copy: heroHeadline,
 * heroSubheadline, seoTitle, seoDescription, 6 FAQs, 2 sample questions.
 *
 * Kubernetes CKA is deliberately excluded: it's a 100% performance/lab exam (no multiple-
 * choice items), which the sampleQuestions shape (options + answerIndex) can't represent
 * without fabricating a question format the real exam doesn't use.
 *
 * Output is NOT written directly into config/exam-landing-pages.ts — it's written to
 * scripts/seo/generated-landings.json for human review before anyone merges it in.
 *
 * USAGE
 *   OPENAI_API_KEY=... npx tsx scripts/seo/generate-exam-landings.ts
 */
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { OpenAIService } from '@/features/services/openAI.service';
import type { PromptDefinition } from '@/config/prompts/types';

interface FactSection {
  readonly name: string;
  readonly weight: number;
}

interface ExamFacts {
  readonly slug: string;
  readonly name: string;
  readonly fullName: string;
  readonly provider: string;
  readonly examType: 'certification';
  readonly totalQuestions: number;
  readonly examDurationMinutes: number;
  readonly passingScore: number;
  readonly topics: readonly FactSection[];
}

// Weights below are copied verbatim from add-catalog-certs.ts's `sections[].minQuestions`
// (that seed already stores each domain's official published WEIGHT, not a literal question
// count — every list already sums to 100 except CFA Level I, whose ranges are normalized to
// integers below).
const EXAM_FACTS: readonly ExamFacts[] = [
  {
    slug: 'aws-developer-associate',
    name: 'AWS DVA-C02',
    fullName: 'AWS Certified Developer - Associate',
    provider: 'Amazon Web Services',
    examType: 'certification',
    totalQuestions: 65,
    examDurationMinutes: 130,
    passingScore: 72,
    topics: [
      { name: 'Desenvolvimento com Serviços AWS', weight: 32 },
      { name: 'Segurança', weight: 26 },
      { name: 'Implantação', weight: 24 },
      { name: 'Troubleshooting e Otimização', weight: 18 },
    ],
  },
  {
    slug: 'gcp-professional-cloud-architect',
    name: 'GCP Professional Cloud Architect',
    fullName: 'Google Cloud Professional Cloud Architect',
    provider: 'Google Cloud',
    examType: 'certification',
    totalQuestions: 60,
    examDurationMinutes: 120,
    passingScore: 70,
    topics: [
      { name: 'Design de Arquitetura de Solução em Nuvem', weight: 25 },
      { name: 'Gestão e Provisionamento de Infraestrutura', weight: 18 },
      { name: 'Segurança e Compliance', weight: 18 },
      { name: 'Otimização de Processos Técnicos e de Negócio', weight: 15 },
      { name: 'Gestão de Implementação', weight: 12 },
      { name: 'Excelência Operacional', weight: 12 },
    ],
  },
  {
    slug: 'comptia-security-plus',
    name: 'CompTIA Security+',
    fullName: 'CompTIA Security+ (SY0-701)',
    provider: 'CompTIA',
    examType: 'certification',
    totalQuestions: 90,
    examDurationMinutes: 90,
    passingScore: 83,
    topics: [
      { name: 'Conceitos Gerais de Segurança', weight: 12 },
      { name: 'Ameaças, Vulnerabilidades e Mitigações', weight: 22 },
      { name: 'Arquitetura de Segurança', weight: 18 },
      { name: 'Operações de Segurança', weight: 28 },
      { name: 'Gestão de Programa de Segurança', weight: 20 },
    ],
  },
  {
    slug: 'cisco-ccna',
    name: 'Cisco CCNA',
    fullName: 'Cisco Certified Network Associate (200-301)',
    provider: 'Cisco',
    examType: 'certification',
    totalQuestions: 120,
    examDurationMinutes: 120,
    passingScore: 82,
    topics: [
      { name: 'Fundamentos de Redes', weight: 20 },
      { name: 'Acesso à Rede', weight: 20 },
      { name: 'Conectividade IP', weight: 25 },
      { name: 'Serviços IP', weight: 10 },
      { name: 'Fundamentos de Segurança', weight: 15 },
      { name: 'Automação e Programabilidade', weight: 10 },
    ],
  },
  {
    slug: 'terraform-associate',
    name: 'Terraform Associate',
    fullName: 'HashiCorp Certified: Terraform Associate (004)',
    provider: 'HashiCorp',
    examType: 'certification',
    totalQuestions: 57,
    examDurationMinutes: 60,
    passingScore: 70,
    topics: [
      { name: 'Infraestrutura como Código com Terraform', weight: 12 },
      { name: 'Fundamentos do Terraform', weight: 13 },
      { name: 'Fluxo de Trabalho Principal', weight: 13 },
      { name: 'Configuração do Terraform', weight: 14 },
      { name: 'Módulos do Terraform', weight: 12 },
      { name: 'Gestão de Estado', weight: 14 },
      { name: 'Manutenção de Infraestrutura', weight: 13 },
      { name: 'HCP Terraform', weight: 9 },
    ],
  },
  {
    slug: 'cfa-level-1',
    name: 'CFA Level I',
    fullName: 'Chartered Financial Analyst — Level I',
    provider: 'CFA Institute',
    examType: 'certification',
    totalQuestions: 180,
    examDurationMinutes: 270,
    passingScore: 65,
    // Institute publishes ranges (e.g. 15-20%); midpoints normalized to sum to 100.
    topics: [
      { name: 'Ética e Padrões Profissionais', weight: 18 },
      { name: 'Métodos Quantitativos', weight: 7 },
      { name: 'Economia', weight: 7 },
      { name: 'Análise de Demonstrações Financeiras', weight: 12 },
      { name: 'Emissores Corporativos', weight: 7 },
      { name: 'Investimentos em Renda Variável', weight: 13 },
      { name: 'Renda Fixa', weight: 13 },
      { name: 'Derivativos', weight: 6 },
      { name: 'Investimentos Alternativos', weight: 7 },
      { name: 'Gestão de Portfólio', weight: 10 },
    ],
  },
  {
    slug: 'frm-part-1',
    name: 'FRM Part I',
    fullName: 'Financial Risk Manager — Part I',
    provider: 'GARP',
    examType: 'certification',
    totalQuestions: 100,
    examDurationMinutes: 240,
    passingScore: 60,
    topics: [
      { name: 'Fundamentos de Gestão de Risco', weight: 20 },
      { name: 'Análise Quantitativa', weight: 20 },
      { name: 'Mercados e Produtos Financeiros', weight: 30 },
      { name: 'Modelos de Precificação e Risco', weight: 30 },
    ],
  },
  {
    slug: 'cfp',
    name: 'CFP',
    fullName: 'Certificação CFP — Planejador Financeiro Pessoal (PLANEJAR)',
    provider: 'PLANEJAR',
    examType: 'certification',
    totalQuestions: 140,
    examDurationMinutes: 420,
    passingScore: 70,
    topics: [
      { name: 'Planejamento Financeiro: Princípios, Processos e Habilidades', weight: 13 },
      { name: 'Gestão Financeira', weight: 15 },
      { name: 'Planejamento de Investimentos e Gestão de Ativos', weight: 17 },
      { name: 'Planejamento da Aposentadoria', weight: 12 },
      { name: 'Planejamento de Seguros e Gestão de Riscos', weight: 12 },
      { name: 'Planejamento Tributário', weight: 12 },
      { name: 'Planejamento Patrimonial e Sucessório', weight: 12 },
      { name: 'Psicologia no Planejamento Financeiro', weight: 7 },
    ],
  },
  {
    slug: 'cpa-10',
    name: 'CPA-10',
    fullName: 'Certificação Profissional ANBIMA Série 10',
    provider: 'ANBIMA',
    examType: 'certification',
    totalQuestions: 50,
    examDurationMinutes: 90,
    passingScore: 70,
    topics: [
      { name: 'Sistema Financeiro Nacional e Participantes do Mercado', weight: 5 },
      { name: 'Compliance, Ética e Análise do Perfil do Investidor', weight: 10 },
      { name: 'Noções de Economia e Finanças', weight: 15 },
      { name: 'Princípios de Investimento', weight: 30 },
      { name: 'Fundos de Investimento', weight: 20 },
      { name: 'Instrumentos de Renda Fixa e Renda Variável', weight: 10 },
      { name: 'Previdência Complementar', weight: 10 },
    ],
  },
  {
    slug: 'aai-ancord',
    name: 'AAI',
    fullName: 'Agente Autônomo de Investimentos (ANCORD)',
    provider: 'ANCORD',
    examType: 'certification',
    totalQuestions: 80,
    examDurationMinutes: 150,
    passingScore: 70,
    topics: [
      { name: 'Atividade do Assessor de Investimentos', weight: 15 },
      { name: 'Prevenção à Lavagem de Dinheiro (PLD/AML)', weight: 5 },
      { name: 'Mercado de Capitais — Produtos e Modalidades Operacionais', weight: 25 },
      { name: 'Mercados Derivativos', weight: 15 },
      { name: 'Mercado Financeiro — Outros Produtos', weight: 9 },
      { name: 'Administração de Risco', weight: 5 },
      { name: 'Fundos de Investimento', weight: 5 },
      { name: 'Matemática Financeira', weight: 5 },
      { name: 'Sistema Financeiro Nacional', weight: 4 },
      { name: 'Instituições e Intermediadores Financeiros', weight: 4 },
      { name: 'Clubes de Investimentos', weight: 3 },
      { name: 'Fundos de Investimento — Anexos CVM 175/23', weight: 2 },
      { name: 'Economia', weight: 2 },
      { name: 'Securitização de Recebíveis', weight: 1 },
    ],
  },
];

interface LandingCopyInput {
  readonly facts: ExamFacts;
}

const landingCopyPrompt: PromptDefinition<LandingCopyInput> = {
  build({ facts }) {
    const topicList = facts.topics.map((t) => `- ${t.name}: ${t.weight}% da prova`).join('\n');

    return `Você escreve copy de marketing e questões de exemplo para o CertifiqueAI, uma plataforma brasileira de preparação para certificações. Gere o conteúdo para a landing page do exame abaixo.

EXAME: ${facts.fullName} (${facts.name})
Emissor: ${facts.provider}
Total de questões: ${facts.totalQuestions}
Duração: ${facts.examDurationMinutes} minutos
Nota de corte: ${facts.passingScore}%
Tópicos do edital e seus pesos:
${topicList}

Responda em JSON com exatamente este formato (não invente números diferentes dos fatos acima):
{
  "heroHeadline": "título curto e direto em português, no estilo 'Questões novas de X todo dia, com o porquê de cada alternativa' — adapte ao exame",
  "heroSubheadline": "1-2 frases em português explicando a proposta: questões novas no formato da prova, com explicação de cada alternativa, sem precisar decorar gabarito",
  "seoTitle": "título de até 60 caracteres, formato 'Simulado ${facts.name} grátis com gabarito comentado' ou similar",
  "seoDescription": "meta description de até 155 caracteres mencionando que as 10 primeiras questões são grátis e sem cadastro",
  "faqs": [
    { "question": "pergunta 1 (ex: quantas questões tem a prova)", "answer": "resposta factual usando os números acima" },
    { "question": "pergunta 2 (ex: nota mínima para passar)", "answer": "resposta factual usando os números acima" },
    { "question": "pergunta 3 sobre o formato/fidelidade das questões ao edital", "answer": "resposta" },
    { "question": "pergunta 4 sobre repetição de questões", "answer": "resposta" },
    { "question": "pergunta 5 sobre como as questões são geradas/verificadas", "answer": "resposta" },
    { "question": "pergunta 6 relevante ao exame específico", "answer": "resposta" }
  ],
  "sampleQuestions": [
    {
      "topic": "nome de um dos tópicos acima (escolha o de MAIOR peso)",
      "stem": "enunciado de uma questão de múltipla escolha realista para este exame, em português, no nível de dificuldade real da prova",
      "options": ["alternativa A", "alternativa B", "alternativa C", "alternativa D"],
      "answerIndex": 0,
      "explanation": "explicação de por que a resposta correta está certa e por que pelo menos uma das erradas é uma distratora plausível"
    },
    {
      "topic": "nome de OUTRO tópico acima (escolha o de SEGUNDO maior peso)",
      "stem": "...",
      "options": ["...", "...", "...", "..."],
      "answerIndex": 0,
      "explanation": "..."
    }
  ]
}

Regras importantes:
- O array "sampleQuestions" deve ter EXATAMENTE 2 itens — nem 1, nem 3, nem um por tópico. Apenas 2, cobrindo só os dois tópicos de maior peso.
- O array "faqs" deve ter EXATAMENTE 6 itens.
- As questões de exemplo devem ser tecnicamente corretas e realistas para quem já estuda para ${facts.name}. Se não tiver certeza técnica absoluta, escolha um conceito mais básico e inquestionável do tópico em vez de um caso de borda.
- Não repita os números de fatos (${facts.totalQuestions} questões, ${facts.examDurationMinutes} minutos, ${facts.passingScore}%) incorretamente — copie exatamente.
- Responda em português do Brasil, mesmo que o exame seja internacional.
- Retorne SOMENTE o JSON, sem markdown, sem texto antes ou depois. Confira a contagem de "sampleQuestions" (2) e "faqs" (6) antes de responder.`;
  },
};

interface GeneratedLandingCopy {
  readonly heroHeadline: string;
  readonly heroSubheadline: string;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly faqs: ReadonlyArray<{ question: string; answer: string }>;
  readonly sampleQuestions: ReadonlyArray<{
    topic: string;
    stem: string;
    options: readonly string[];
    answerIndex: number;
    explanation: string;
  }>;
}

function validateCopy(copy: unknown, slug: string): GeneratedLandingCopy {
  const c = copy as GeneratedLandingCopy;
  const problems: string[] = [];

  if (!c?.heroHeadline) problems.push('missing heroHeadline');
  if (!c?.heroSubheadline) problems.push('missing heroSubheadline');
  if (!c?.seoTitle) problems.push('missing seoTitle');
  if (!c?.seoDescription) problems.push('missing seoDescription');
  if (!Array.isArray(c?.faqs) || c.faqs.length !== 6) problems.push(`faqs: expected 6, got ${c?.faqs?.length}`);
  if (!Array.isArray(c?.sampleQuestions) || c.sampleQuestions.length !== 2) {
    problems.push(`sampleQuestions: expected 2, got ${c?.sampleQuestions?.length}`);
  }
  c?.sampleQuestions?.forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`sampleQuestions[${i}]: expected 4 options`);
    if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex > 3) {
      problems.push(`sampleQuestions[${i}]: invalid answerIndex ${q.answerIndex}`);
    }
  });

  if (problems.length > 0) {
    throw new Error(`[${slug}] generated copy failed validation: ${problems.join('; ')}`);
  }

  return c;
}

async function main() {
  const openAIService = new OpenAIService();
  const outPath = join(process.cwd(), 'scripts', 'seo', 'generated-landings.json');

  // Resumable: a slug that already has a successful ("copy") entry from a previous run
  // is skipped, so a retry after fixing the prompt only re-spends money on the failures.
  const results: Record<string, unknown> = existsSync(outPath)
    ? JSON.parse(readFileSync(outPath, 'utf-8'))
    : {};

  for (const facts of EXAM_FACTS) {
    const existing = results[facts.slug] as { copy?: unknown } | undefined;
    if (existing?.copy) {
      console.log(`Skipping ${facts.slug} (already generated)`);
      continue;
    }

    process.stdout.write(`Generating ${facts.slug}... `);
    try {
      const { text } = await openAIService.call(landingCopyPrompt, { facts }, { jsonMode: true, webSearch: false });
      const parsed = JSON.parse(text);
      const copy = validateCopy(parsed, facts.slug);
      results[facts.slug] = { facts, copy };
      console.log('ok');
    } catch (err) {
      console.log('FAILED');
      results[facts.slug] = { facts, error: err instanceof Error ? err.message : String(err) };
    }
  }

  writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nWrote ${outPath} — review before merging into config/exam-landing-pages.ts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
