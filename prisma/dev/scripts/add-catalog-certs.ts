import { prisma } from '@/lib/prisma';

async function main() {
  console.log('Adding catalog certification templates...');

  // ── Providers ──────────────────────────────────────────────────────────────

  const aws = await prisma.provider.upsert({
    where: { name: 'AWS' },
    update: {},
    create: {
      name: 'AWS',
      fullName: 'Amazon Web Services',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    },
  });

  const microsoft = await prisma.provider.upsert({
    where: { name: 'Microsoft' },
    update: {},
    create: {
      name: 'Microsoft',
      fullName: 'Microsoft Corporation',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    },
  });

  const google = await prisma.provider.upsert({
    where: { name: 'Google' },
    update: {},
    create: {
      name: 'Google',
      fullName: 'Google LLC',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    },
  });

  const comptia = await prisma.provider.upsert({
    where: { name: 'CompTIA' },
    update: {},
    create: {
      name: 'CompTIA',
      fullName: 'Computing Technology Industry Association',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Comptia-logo.svg',
    },
  });

  const cisco = await prisma.provider.upsert({
    where: { name: 'Cisco' },
    update: {},
    create: {
      name: 'Cisco',
      fullName: 'Cisco Systems',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg',
    },
  });

  const hashicorp = await prisma.provider.upsert({
    where: { name: 'HashiCorp' },
    update: {},
    create: {
      name: 'HashiCorp',
      fullName: 'HashiCorp Inc.',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/HashiCorp_horizontal_logo.svg',
    },
  });

  const cncf = await prisma.provider.upsert({
    where: { name: 'CNCF' },
    update: {},
    create: {
      name: 'CNCF',
      fullName: 'Cloud Native Computing Foundation',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Cloud_Native_Computing_Foundation_2023_logo.svg',
    },
  });

  const cfaInstitute = await prisma.provider.upsert({
    where: { name: 'CFA Institute' },
    update: {},
    create: {
      name: 'CFA Institute',
      fullName: 'CFA Institute',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Cfa-institute-logo.svg',
    },
  });

  const garp = await prisma.provider.upsert({
    where: { name: 'GARP' },
    update: {},
    create: {
      name: 'GARP',
      fullName: 'Global Association of Risk Professionals',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/en/2/26/Global_Association_of_Risk_Professionals_%28GARP%29_Logo.png',
    },
  });

  const cfpBoard = await prisma.provider.upsert({
    where: { name: 'CFP Board' },
    update: {},
    create: {
      name: 'CFP Board',
      fullName: 'Certified Financial Planner Board of Standards',
      logoUrl: 'https://www.cfp.net/assets/images/logo-cfp-board-black-white.svg',
    },
  });

  const anbima = await prisma.provider.upsert({
    where: { name: 'ANBIMA' },
    update: {},
    create: {
      name: 'ANBIMA',
      fullName: 'Associação Brasileira das Entidades dos Mercados Financeiro e de Capitais',
      logoUrl:
        'https://www.anbima.com.br/lumis-theme/br/com/anbima/portal/theme/portal-anbima/assets/img/logo-anbima.png',
    },
  });

  const ancord = await prisma.provider.upsert({
    where: { name: 'ANCORD' },
    update: {},
    create: {
      name: 'ANCORD',
      fullName: 'Associação Nacional das Corretoras e Distribuidoras de Títulos e Valores Mobiliários',
      logoUrl: 'https://www.ancord.org.br/wp-content/themes/ancord/assets/images/logo-ancord.svg',
    },
  });

  const planejar = await prisma.provider.upsert({
    where: { name: 'PLANEJAR' },
    update: {},
    create: {
      name: 'PLANEJAR',
      fullName: 'Associação Brasileira de Planejadores Financeiros',
      logoUrl: 'https://framerusercontent.com/images/0mCuFuGOnN9T9Ux7ioZdPGcujw.png',
    },
  });

  // ── Tech certifications ────────────────────────────────────────────────────

  const techCerts = [
    {
      name: 'AWS Certified Solutions Architect – Associate',
      key: 'SAA-C03',
      year: 2024,
      totalQuestions: 65,
      examDurationMinutes: 130,
      passingScore: 72,
      providerId: aws.id,
      sections: [
        { name: 'Design Secure Architectures', minQuestions: 30, maxQuestions: 30 },
        { name: 'Design Resilient Architectures', minQuestions: 26, maxQuestions: 26 },
        { name: 'Design High-Performing Architectures', minQuestions: 24, maxQuestions: 24 },
        { name: 'Design Cost-Optimized Architectures', minQuestions: 20, maxQuestions: 20 },
      ],
    },
    {
      name: 'AWS Certified Developer – Associate',
      key: 'DVA-C02',
      year: 2024,
      totalQuestions: 65,
      examDurationMinutes: 130,
      passingScore: 72,
      providerId: aws.id,
      sections: [
        { name: 'Development with AWS Services', minQuestions: 32, maxQuestions: 32 },
        { name: 'Security', minQuestions: 26, maxQuestions: 26 },
        { name: 'Deployment', minQuestions: 24, maxQuestions: 24 },
        { name: 'Troubleshooting and Optimization', minQuestions: 18, maxQuestions: 18 },
      ],
    },
    {
      name: 'Microsoft Azure Administrator',
      key: 'AZ-104',
      year: 2024,
      totalQuestions: 60,
      examDurationMinutes: 100,
      passingScore: 70,
      providerId: microsoft.id,
      sections: [
        { name: 'Manage Azure Identities and Governance', minQuestions: 20, maxQuestions: 25 },
        { name: 'Implement and Manage Storage', minQuestions: 15, maxQuestions: 20 },
        { name: 'Deploy and Manage Azure Compute Resources', minQuestions: 20, maxQuestions: 25 },
        { name: 'Implement and Manage Virtual Networking', minQuestions: 15, maxQuestions: 20 },
        { name: 'Monitor and Maintain Azure Resources', minQuestions: 10, maxQuestions: 15 },
      ],
    },
    {
      name: 'Microsoft Azure Fundamentals',
      key: 'AZ-900',
      year: 2024,
      totalQuestions: 60,
      examDurationMinutes: 45,
      passingScore: 70,
      providerId: microsoft.id,
      sections: [
        { name: 'Cloud Concepts', minQuestions: 25, maxQuestions: 30 },
        { name: 'Azure Architecture and Services', minQuestions: 35, maxQuestions: 40 },
        { name: 'Azure Management and Governance', minQuestions: 30, maxQuestions: 35 },
      ],
    },
    {
      name: 'Google Cloud Professional Cloud Architect',
      key: 'PCA',
      year: 2024,
      totalQuestions: 60,
      examDurationMinutes: 120,
      passingScore: 70,
      providerId: google.id,
      sections: [
        { name: 'Designing and planning a cloud solution architecture', minQuestions: 25, maxQuestions: 25 },
        { name: 'Managing and provisioning a cloud solution infrastructure', minQuestions: 18, maxQuestions: 18 },
        { name: 'Designing for security and compliance', minQuestions: 18, maxQuestions: 18 },
        { name: 'Analyzing and optimizing technical and business processes', minQuestions: 15, maxQuestions: 15 },
        { name: 'Managing implementation', minQuestions: 12, maxQuestions: 12 },
        { name: 'Ensuring solution and operations excellence', minQuestions: 12, maxQuestions: 12 },
      ],
    },
    {
      name: 'CompTIA Security+',
      key: 'SY0-701',
      year: 2024,
      totalQuestions: 90,
      examDurationMinutes: 90,
      passingScore: 83,
      providerId: comptia.id,
      sections: [
        { name: 'General Security Concepts', minQuestions: 12, maxQuestions: 12 },
        { name: 'Threats, Vulnerabilities, and Mitigations', minQuestions: 22, maxQuestions: 22 },
        { name: 'Security Architecture', minQuestions: 18, maxQuestions: 18 },
        { name: 'Security Operations', minQuestions: 28, maxQuestions: 28 },
        { name: 'Security Program Management and Oversight', minQuestions: 20, maxQuestions: 20 },
      ],
    },
    {
      name: 'Cisco CCNA',
      key: '200-301',
      year: 2024,
      totalQuestions: 120,
      examDurationMinutes: 120,
      passingScore: 82,
      providerId: cisco.id,
      sections: [
        { name: 'Network Fundamentals', minQuestions: 20, maxQuestions: 20 },
        { name: 'Network Access', minQuestions: 20, maxQuestions: 20 },
        { name: 'IP Connectivity', minQuestions: 25, maxQuestions: 25 },
        { name: 'IP Services', minQuestions: 10, maxQuestions: 10 },
        { name: 'Security Fundamentals', minQuestions: 15, maxQuestions: 15 },
        { name: 'Automation and Programmability', minQuestions: 10, maxQuestions: 10 },
      ],
    },
    {
      name: 'HashiCorp Terraform Associate',
      key: '004',
      year: 2025,
      totalQuestions: 57,
      examDurationMinutes: 60,
      passingScore: 70,
      providerId: hashicorp.id,
      sections: [
        { name: 'Infrastructure as Code (IaC) with Terraform', minQuestions: 12, maxQuestions: 12 },
        { name: 'Terraform fundamentals', minQuestions: 13, maxQuestions: 13 },
        { name: 'Core Terraform workflow', minQuestions: 13, maxQuestions: 13 },
        { name: 'Terraform configuration', minQuestions: 14, maxQuestions: 14 },
        { name: 'Terraform modules', minQuestions: 12, maxQuestions: 12 },
        { name: 'Terraform state management', minQuestions: 14, maxQuestions: 14 },
        { name: 'Maintain infrastructure with Terraform', minQuestions: 13, maxQuestions: 13 },
        { name: 'HCP Terraform', minQuestions: 9, maxQuestions: 9 },
      ],
    },
    {
      name: 'Kubernetes CKA',
      key: 'CKA',
      year: 2024,
      totalQuestions: 17,
      examDurationMinutes: 120,
      passingScore: 66,
      providerId: cncf.id,
      sections: [
        { name: 'Cluster Architecture, Installation and Configuration', minQuestions: 25, maxQuestions: 25 },
        { name: 'Workloads and Scheduling', minQuestions: 15, maxQuestions: 15 },
        { name: 'Services and Networking', minQuestions: 20, maxQuestions: 20 },
        { name: 'Storage', minQuestions: 10, maxQuestions: 10 },
        { name: 'Troubleshooting', minQuestions: 30, maxQuestions: 30 },
      ],
    },
  ];

  // ── Finance certifications ─────────────────────────────────────────────────

  const financeCerts = [
    {
      name: 'CFA Level I',
      key: 'CFA-I',
      year: 2025,
      totalQuestions: 180,
      examDurationMinutes: 270,
      passingScore: 65,
      providerId: cfaInstitute.id,
      sections: [
        { name: 'Ethical and Professional Standards', minQuestions: 15, maxQuestions: 20 },
        { name: 'Quantitative Methods', minQuestions: 6, maxQuestions: 9 },
        { name: 'Economics', minQuestions: 6, maxQuestions: 9 },
        { name: 'Financial Statement Analysis', minQuestions: 11, maxQuestions: 14 },
        { name: 'Corporate Issuers', minQuestions: 6, maxQuestions: 9 },
        { name: 'Equity Investments', minQuestions: 11, maxQuestions: 14 },
        { name: 'Fixed Income', minQuestions: 11, maxQuestions: 14 },
        { name: 'Derivatives', minQuestions: 5, maxQuestions: 8 },
        { name: 'Alternative Investments', minQuestions: 7, maxQuestions: 10 },
        { name: 'Portfolio Management', minQuestions: 8, maxQuestions: 12 },
      ],
    },
    {
      name: 'FRM Part I',
      key: 'FRM-I',
      year: 2025,
      totalQuestions: 100,
      examDurationMinutes: 240,
      passingScore: 60,
      providerId: garp.id,
      sections: [
        { name: 'Foundations of Risk Management', minQuestions: 20, maxQuestions: 20 },
        { name: 'Quantitative Analysis', minQuestions: 20, maxQuestions: 20 },
        { name: 'Financial Markets and Products', minQuestions: 30, maxQuestions: 30 },
        { name: 'Valuation and Risk Models', minQuestions: 30, maxQuestions: 30 },
      ],
    },
    {
      name: 'Certified Financial Planner',
      key: 'CFP',
      year: 2025,
      totalQuestions: 170,
      examDurationMinutes: 360,
      passingScore: 64,
      providerId: cfpBoard.id,
      sections: [
        { name: 'Professional Conduct and Regulation', minQuestions: 8, maxQuestions: 8 },
        { name: 'General Principles of Financial Planning', minQuestions: 15, maxQuestions: 15 },
        { name: 'Risk Management and Insurance Planning', minQuestions: 11, maxQuestions: 11 },
        { name: 'Investment Planning', minQuestions: 17, maxQuestions: 17 },
        { name: 'Tax Planning', minQuestions: 14, maxQuestions: 14 },
        { name: 'Retirement Savings and Income Planning', minQuestions: 18, maxQuestions: 18 },
        { name: 'Estate Planning', minQuestions: 10, maxQuestions: 10 },
        { name: 'Psychology of Financial Planning', minQuestions: 7, maxQuestions: 7 },
      ],
    },
    {
      name: 'CPA-10 — Certificação Profissional ANBIMA Série 10',
      key: 'CPA-10',
      year: 2025,
      totalQuestions: 50,
      examDurationMinutes: 90,
      passingScore: 70,
      providerId: anbima.id,
      sections: [
        { name: 'Sistema Financeiro Nacional e Participantes do Mercado', minQuestions: 5, maxQuestions: 5 },
        { name: 'Compliance, Ética e Análise do Perfil do Investidor', minQuestions: 10, maxQuestions: 10 },
        { name: 'Noções de Economia e Finanças', minQuestions: 15, maxQuestions: 15 },
        { name: 'Princípios de Investimento', minQuestions: 30, maxQuestions: 30 },
        { name: 'Fundos de Investimento', minQuestions: 20, maxQuestions: 20 },
        { name: 'Instrumentos de Renda Fixa e Renda Variável', minQuestions: 10, maxQuestions: 10 },
        { name: 'Previdência Complementar', minQuestions: 10, maxQuestions: 10 },
      ],
    },
    {
      name: 'CPA-20 — Certificação Profissional ANBIMA Série 20',
      key: 'CPA-20',
      year: 2025,
      totalQuestions: 60,
      examDurationMinutes: 150,
      passingScore: 70,
      providerId: anbima.id,
      sections: [
        { name: 'Sistema Financeiro Nacional e Participantes do Mercado', minQuestions: 5, maxQuestions: 10 },
        { name: 'Compliance, Ética e Análise do Perfil do Investidor', minQuestions: 15, maxQuestions: 25 },
        { name: 'Economia e Finanças', minQuestions: 5, maxQuestions: 10 },
        { name: 'Renda Fixa, Renda Variável e Derivativos', minQuestions: 17, maxQuestions: 25 },
        { name: 'Fundos de Investimento', minQuestions: 18, maxQuestions: 25 },
        { name: 'Previdência Complementar', minQuestions: 5, maxQuestions: 10 },
        { name: 'Mensuração e Gestão de Performance e Riscos', minQuestions: 10, maxQuestions: 20 },
      ],
    },
    {
      name: 'CEA — Certificação de Especialista em Investimentos ANBIMA',
      key: 'CEA',
      year: 2025,
      totalQuestions: 70,
      examDurationMinutes: 150,
      passingScore: 70,
      providerId: anbima.id,
      sections: [
        { name: 'Planejamento de Investimentos e API', minQuestions: 15, maxQuestions: 15 },
        { name: 'Fundos de Investimento', minQuestions: 15, maxQuestions: 15 },
        { name: 'Produtos de Renda Fixa', minQuestions: 15, maxQuestions: 15 },
        { name: 'Produtos de Renda Variável', minQuestions: 15, maxQuestions: 15 },
        { name: 'Derivativos', minQuestions: 10, maxQuestions: 10 },
        { name: 'Análise de Investimentos', minQuestions: 20, maxQuestions: 20 },
        { name: 'Finanças Pessoais e Planejamento de Aposentadoria', minQuestions: 10, maxQuestions: 10 },
      ],
    },
    {
      name: 'CFP — Planejador Financeiro Pessoal (PLANEJAR)',
      key: 'CFP-BR',
      year: 2025,
      totalQuestions: 140,
      examDurationMinutes: 420,
      passingScore: 70,
      providerId: planejar.id,
      sections: [
        { name: 'Planejamento Financeiro: Princípios, Processos e Habilidades', minQuestions: 13, maxQuestions: 13 },
        { name: 'Gestão Financeira', minQuestions: 15, maxQuestions: 15 },
        { name: 'Planejamento de Investimentos e Gestão de Ativos', minQuestions: 17, maxQuestions: 17 },
        { name: 'Planejamento da Aposentadoria', minQuestions: 12, maxQuestions: 12 },
        { name: 'Planejamento de Seguros e Gestão de Riscos', minQuestions: 12, maxQuestions: 12 },
        { name: 'Planejamento Tributário', minQuestions: 12, maxQuestions: 12 },
        { name: 'Planejamento Patrimonial e Sucessório', minQuestions: 12, maxQuestions: 12 },
        { name: 'Psicologia no Planejamento Financeiro', minQuestions: 7, maxQuestions: 7 },
      ],
    },
    {
      name: 'AAI — Agente Autônomo de Investimentos (ANCORD)',
      key: 'AAI',
      year: 2025,
      totalQuestions: 80,
      examDurationMinutes: 150,
      passingScore: 70,
      providerId: ancord.id,
      sections: [
        { name: 'Atividade do Assessor de Investimentos', minQuestions: 15, maxQuestions: 15 },
        { name: 'Prevenção à Lavagem de Dinheiro (PLD/AML)', minQuestions: 5, maxQuestions: 5 },
        { name: 'Economia', minQuestions: 2, maxQuestions: 2 },
        { name: 'Sistema Financeiro Nacional', minQuestions: 4, maxQuestions: 4 },
        { name: 'Instituições e Intermediadores Financeiros', minQuestions: 4, maxQuestions: 4 },
        { name: 'Administração de Risco', minQuestions: 5, maxQuestions: 5 },
        { name: 'Mercado de Capitais — Produtos e Modalidades Operacionais', minQuestions: 25, maxQuestions: 25 },
        { name: 'Fundos de Investimento', minQuestions: 5, maxQuestions: 5 },
        { name: 'Fundos de Investimento — Anexos CVM 175/23', minQuestions: 2, maxQuestions: 2 },
        { name: 'Securitização de Recebíveis', minQuestions: 1, maxQuestions: 1 },
        { name: 'Clubes de Investimentos', minQuestions: 3, maxQuestions: 3 },
        { name: 'Matemática Financeira', minQuestions: 5, maxQuestions: 5 },
        { name: 'Mercado Financeiro — Outros Produtos', minQuestions: 9, maxQuestions: 9 },
        { name: 'Mercados Derivativos', minQuestions: 15, maxQuestions: 15 },
      ],
    },
  ];

  const allCerts = [...techCerts, ...financeCerts];

  for (const cert of allCerts) {
    const existing = await prisma.exam.findFirst({
      where: { name: cert.name, isTemplate: true },
    });
    if (existing) {
      console.log(`  Skipping (already exists): ${cert.name}`);
      continue;
    }

    const { sections, providerId, ...examData } = cert;
    await prisma.exam.create({
      data: {
        ...examData,
        type: 'certification',
        isTemplate: true,
        providerId,
        sections: {
          create: sections,
        },
      },
    });
    console.log(`  Created: ${cert.name}`);
  }

  console.log('\nDone.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
