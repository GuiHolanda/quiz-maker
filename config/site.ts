export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "My Quiz",
  description: "Make smart quizzes for you certification practice.",
  navItems: [
    // {
    //   label: "Home",
    //   href: "/",
    // },
  ],
  navMenuItems: [
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    docs: "https://heroui.com",
  },
};
