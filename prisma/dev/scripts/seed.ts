import { prisma } from '@/lib/prisma';

interface SeedQuestion {
  text: string;
  correctCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  options: Record<string, string>;
  answer: { correctOptions: string[]; explanations: Record<string, string> };
}

function buildQuestion(
  examName: string,
  sectionName: string,
  topicName: string | null,
  q: SeedQuestion,
  refs: { examId: string; sectionId: string; topicId?: string | null }
) {
  return prisma.examQuestion.create({
    data: {
      text: q.text,
      correctCount: q.correctCount,
      difficulty: q.difficulty,
      examName,
      sectionName,
      topicName,
      examId: refs.examId,
      sectionId: refs.sectionId,
      topicId: refs.topicId ?? null,
      options: {
        create: Object.entries(q.options).map(([label, text]) => ({ label, text })),
      },
      answer: {
        create: {
          correctOptions: q.answer.correctOptions,
          explanations: {
            create: Object.entries(q.answer.explanations).map(([label, text]) => ({ label, text })),
          },
        },
      },
    },
  });
}

const CERT_QUESTIONS: SeedQuestion[] = [
  {
    text: 'What is the primary purpose of the Product Cockpit in SAP Commerce Cloud?',
    correctCount: 1,
    difficulty: 'easy',
    options: {
      A: 'Managing customer orders',
      B: 'Creating and managing product catalog content',
      C: 'Configuring payment gateways',
      D: 'Monitoring server performance',
    },
    answer: {
      correctOptions: ['B'],
      explanations: {
        A: 'Order management is handled in the Order Management module, not the Product Cockpit.',
        B: 'Correct. The Product Cockpit is the central tool for managing product information and catalog content.',
        C: 'Payment configuration is done in the backoffice administration, not the Product Cockpit.',
        D: 'Server monitoring is a system administration task, unrelated to the Product Cockpit.',
      },
    },
  },
  {
    text: 'Which catalog type in SAP Commerce Cloud contains the approved and published product data?',
    correctCount: 1,
    difficulty: 'easy',
    options: {
      A: 'Staged catalog',
      B: 'Draft catalog',
      C: 'Online catalog',
      D: 'Master catalog',
    },
    answer: {
      correctOptions: ['C'],
      explanations: {
        A: 'The staged catalog holds work-in-progress data before synchronization.',
        B: 'There is no "Draft catalog" concept in SAP Commerce Cloud.',
        C: 'Correct. The online catalog holds the synchronized, published data visible to customers.',
        D: 'The master catalog is a logical grouping concept, not the published version.',
      },
    },
  },
  {
    text: 'What is SmartEdit in SAP Commerce Cloud?',
    correctCount: 1,
    difficulty: 'easy',
    options: {
      A: 'A tool for managing product classifications',
      B: 'A WYSIWYG storefront content editing interface',
      C: 'A code editor for WCMS components',
      D: 'A bulk import tool for CMS pages',
    },
    answer: {
      correctOptions: ['B'],
      explanations: {
        A: 'Classifications are managed in Backoffice, not SmartEdit.',
        B: 'Correct. SmartEdit provides a live, in-context editing experience for storefront content.',
        C: 'Component code is managed by developers, not through SmartEdit.',
        D: 'Bulk import uses ImpEx, not SmartEdit.',
      },
    },
  },
];

const PUBLIC_EXAM_QUESTIONS: SeedQuestion[] = [
  {
    text: 'Assinale a alternativa em que o emprego do acento indicativo de crase está correto.',
    correctCount: 1,
    difficulty: 'medium',
    options: {
      A: 'Refiro-me à uma situação específica.',
      B: 'Entreguei o documento à secretária.',
      C: 'Cheguei à pé na repartição.',
      D: 'Ela saiu à procurar emprego.',
    },
    answer: {
      correctOptions: ['B'],
      explanations: {
        A: 'Não se usa crase antes de artigo indefinido "uma".',
        B: 'Correto. "Entregar a alguém" + artigo "a" (a secretária) resulta em crase.',
        C: 'Não há crase antes de palavra masculina ("pé").',
        D: 'Não se usa crase antes de verbo no infinitivo ("procurar").',
      },
    },
  },
  {
    text: 'Segundo a Constituição Federal, são direitos sociais, EXCETO:',
    correctCount: 1,
    difficulty: 'hard',
    options: {
      A: 'A educação',
      B: 'A saúde',
      C: 'O voto facultativo',
      D: 'A moradia',
    },
    answer: {
      correctOptions: ['C'],
      explanations: {
        A: 'A educação é direito social (art. 6º).',
        B: 'A saúde é direito social (art. 6º).',
        C: 'Correto. O voto é direito político, não social.',
        D: 'A moradia é direito social (art. 6º).',
      },
    },
  },
  {
    text: 'O princípio da legalidade na Administração Pública significa que:',
    correctCount: 1,
    difficulty: 'medium',
    options: {
      A: 'O administrador pode fazer tudo o que a lei não proíbe.',
      B: 'O administrador só pode fazer o que a lei autoriza.',
      C: 'A lei se aplica apenas aos particulares.',
      D: 'O administrador tem liberdade plena de atuação.',
    },
    answer: {
      correctOptions: ['B'],
      explanations: {
        A: 'Esse é o princípio da legalidade para o particular, não para a Administração.',
        B: 'Correto. Na Administração Pública, só se faz o que a lei autoriza (legalidade estrita).',
        C: 'A legalidade vincula sobretudo a Administração.',
        D: 'A atuação administrativa é vinculada à lei, não livre.',
      },
    },
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  const aws = await prisma.provider.upsert({
    where: { name: 'AWS' },
    update: { logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg' },
    create: {
      name: 'AWS',
      fullName: 'Amazon Web Services',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    },
  });

  await prisma.provider.upsert({
    where: { name: 'SAP' },
    update: { logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg' },
    create: {
      name: 'SAP',
      fullName: 'SAP SE',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg',
    },
  });

  await prisma.provider.upsert({
    where: { name: 'Microsoft' },
    update: { logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' },
    create: {
      name: 'Microsoft',
      fullName: 'Microsoft Corporation',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    },
  });

  const certExam = await prisma.exam.create({
    data: {
      type: 'certification',
      name: 'AWS Certified Cloud Practitioner',
      year: 2025,
      totalQuestions: 65,
      providerId: aws.id,
      sections: {
        create: [
          { name: 'Cloud Concepts', minQuestions: 20, maxQuestions: 30 },
          { name: 'Security and Compliance', minQuestions: 20, maxQuestions: 30 },
          { name: 'Technology', minQuestions: 25, maxQuestions: 40 },
          { name: 'Billing and Pricing', minQuestions: 10, maxQuestions: 20 },
        ],
      },
    },
    include: { sections: true },
  });
  console.log(`  Created certification exam ${certExam.id} (${certExam.name})`);

  const certSection = certExam.sections[0];
  for (const q of CERT_QUESTIONS) {
    await buildQuestion(certExam.name, certSection.name, null, q, {
      examId: certExam.id,
      sectionId: certSection.id,
    });
  }
  console.log(`  Seeded ${CERT_QUESTIONS.length} certification questions in "${certSection.name}"`);

  const fgv = await prisma.examBoard.upsert({
    where: { name: 'FGV' },
    update: {},
    create: { name: 'FGV', fullName: 'Fundação Getulio Vargas' },
  });

  const examConcurso = await prisma.exam.create({
    data: {
      type: 'public_exam',
      name: 'Analista Judiciário',
      role: 'Analista Judiciário - Área Administrativa',
      year: 2025,
      totalQuestions: 70,
      examBoardId: fgv.id,
      sections: {
        create: [
          {
            name: 'Língua Portuguesa',
            minQuestions: 20,
            maxQuestions: 30,
            topics: { create: [{ name: 'Interpretação de Texto' }, { name: 'Crase' }] },
          },
          {
            name: 'Direito Constitucional',
            minQuestions: 20,
            maxQuestions: 30,
            topics: { create: [{ name: 'Direitos Fundamentais' }] },
          },
        ],
      },
    },
    include: { sections: { include: { topics: true } } },
  });
  console.log(`  Created public exam ${examConcurso.id} (${examConcurso.name})`);

  const portugues = examConcurso.sections.find((s) => s.name === 'Língua Portuguesa')!;
  const craseTopic = portugues.topics.find((t) => t.name === 'Crase')!;
  const direito = examConcurso.sections.find((s) => s.name === 'Direito Constitucional')!;
  const direitosTopic = direito.topics.find((t) => t.name === 'Direitos Fundamentais')!;

  await buildQuestion(examConcurso.name, portugues.name, craseTopic.name, PUBLIC_EXAM_QUESTIONS[0], {
    examId: examConcurso.id,
    sectionId: portugues.id,
    topicId: craseTopic.id,
  });
  await buildQuestion(examConcurso.name, direito.name, direitosTopic.name, PUBLIC_EXAM_QUESTIONS[1], {
    examId: examConcurso.id,
    sectionId: direito.id,
    topicId: direitosTopic.id,
  });
  await buildQuestion(examConcurso.name, direito.name, direitosTopic.name, PUBLIC_EXAM_QUESTIONS[2], {
    examId: examConcurso.id,
    sectionId: direito.id,
    topicId: direitosTopic.id,
  });
  console.log(`  Seeded ${PUBLIC_EXAM_QUESTIONS.length} public exam questions`);

  console.log('\n✅ Seed complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
