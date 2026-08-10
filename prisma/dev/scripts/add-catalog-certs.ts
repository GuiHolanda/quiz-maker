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
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/CompTIA_Logo.svg',
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
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/HashiCorp_logo.svg',
    },
  });

  const cncf = await prisma.provider.upsert({
    where: { name: 'CNCF' },
    update: {},
    create: {
      name: 'CNCF',
      fullName: 'Cloud Native Computing Foundation',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/CNCF-logo.svg',
    },
  });

  const cfaInstitute = await prisma.provider.upsert({
    where: { name: 'CFA Institute' },
    update: {},
    create: {
      name: 'CFA Institute',
      fullName: 'CFA Institute',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/18/CFA_Institute_Logo.svg',
    },
  });

  const garp = await prisma.provider.upsert({
    where: { name: 'GARP' },
    update: {},
    create: {
      name: 'GARP',
      fullName: 'Global Association of Risk Professionals',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/en/thumb/2/26/Global_Association_of_Risk_Professionals_%28GARP%29_Logo.png/330px-Global_Association_of_Risk_Professionals_%28GARP%29_Logo.png',
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
      examDurationMinutes: 120,
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
      examDurationMinutes: 65,
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
        { name: 'Designing and Planning a Cloud Solution Architecture', minQuestions: 24, maxQuestions: 24 },
        { name: 'Managing and Provisioning Cloud Infrastructure', minQuestions: 15, maxQuestions: 15 },
        { name: 'Designing for Security and Compliance', minQuestions: 18, maxQuestions: 18 },
        { name: 'Analyzing and Optimizing Technical and Business Processes', minQuestions: 18, maxQuestions: 18 },
        { name: 'Ensuring Solution and Operations Reliability', minQuestions: 25, maxQuestions: 25 },
      ],
    },
    {
      name: 'CompTIA Security+',
      key: 'SY0-701',
      year: 2024,
      totalQuestions: 90,
      examDurationMinutes: 90,
      passingScore: 75,
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
      key: '003',
      year: 2024,
      totalQuestions: 57,
      examDurationMinutes: 60,
      passingScore: 70,
      providerId: hashicorp.id,
      sections: [
        { name: 'Understand Infrastructure as Code Concepts', minQuestions: 10, maxQuestions: 10 },
        { name: 'Understand Terraform Purpose and Concepts', minQuestions: 15, maxQuestions: 15 },
        { name: 'Use the Terraform CLI', minQuestions: 15, maxQuestions: 15 },
        { name: 'Interact with Terraform Modules', minQuestions: 8, maxQuestions: 8 },
        { name: 'Use and Create Terraform Configurations', minQuestions: 9, maxQuestions: 9 },
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
        { name: 'Ethical and Professional Standards', minQuestions: 15, maxQuestions: 15 },
        { name: 'Quantitative Methods', minQuestions: 8, maxQuestions: 8 },
        { name: 'Economics', minQuestions: 8, maxQuestions: 8 },
        { name: 'Financial Statement Analysis', minQuestions: 13, maxQuestions: 13 },
        { name: 'Corporate Issuers', minQuestions: 9, maxQuestions: 9 },
        { name: 'Equity Investments', minQuestions: 11, maxQuestions: 11 },
        { name: 'Fixed Income', minQuestions: 11, maxQuestions: 11 },
        { name: 'Derivatives', minQuestions: 6, maxQuestions: 6 },
        { name: 'Alternative Investments', minQuestions: 7, maxQuestions: 7 },
        { name: 'Portfolio Management', minQuestions: 12, maxQuestions: 12 },
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
      examDurationMinutes: 370,
      passingScore: 64,
      providerId: cfpBoard.id,
      sections: [
        { name: 'Financial Planning Process', minQuestions: 8, maxQuestions: 8 },
        { name: 'Investment Planning', minQuestions: 17, maxQuestions: 17 },
        { name: 'Tax Planning', minQuestions: 14, maxQuestions: 14 },
        { name: 'Retirement and Employee Benefits Planning', minQuestions: 18, maxQuestions: 18 },
        { name: 'Estate Planning', minQuestions: 10, maxQuestions: 10 },
        { name: 'Risk Management and Insurance', minQuestions: 13, maxQuestions: 13 },
        { name: 'Psychology of Financial Planning', minQuestions: 7, maxQuestions: 7 },
        { name: 'General Financial Planning Principles', minQuestions: 13, maxQuestions: 13 },
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
