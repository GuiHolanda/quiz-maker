export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'CertifiqueAI',
  title: {
    default: 'CertifiqueAI',
    template: '%s | CertifiqueAI',
  },
  description:
    'Prepare-se para certificações (AWS, Azure, SAP, OAB, CPA, CRM) e concursos públicos com questões geradas por IA. Simulados personalizados e explicações detalhadas.',
  navItems: [
    {
      label: 'nav.questions',
      href: '/questions',
    },
    {
      label: 'nav.configureCertification',
      href: '/exams?type=certification',
    },
    {
      label: 'nav.makeYourOwnQuiz',
      href: '/simulados',
    },
  ],
  navMenuItems: [
    {
      label: 'nav.quiz',
      href: '/simulados',
    },
    {
      label: 'nav.questions',
      href: '/questions',
    },
    {
      label: 'nav.configureCertification',
      href: '/exams?type=certification',
    },
  ],
  links: {
    github: 'https://github.com/GuiHolanda/quiz-maker/tree/main',
    docs: 'https://heroui.com',
  },
};
