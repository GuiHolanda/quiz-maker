import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface LegalPageShellProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly children: React.ReactNode;
}

export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  return (
    <div className="bg-navy-900 text-[#e8edf3] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10 flex items-center gap-1.5 text-xs text-navy-500">
          <NextLink className="hover:text-navy-300 transition-colors duration-200" href="/">
            Início
          </NextLink>
          <FontAwesomeIcon className="text-[9px] text-navy-700" icon={faChevronRight} />
          <span className="text-navy-400">{title}</span>
        </nav>

        {/* Page header */}
        <div className="mb-12 pb-8 border-b border-navy-800">
          <h1 className="font-sora text-4xl font-bold text-white leading-tight mb-3">{title}</h1>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-navy-800 border border-navy-700 text-xs text-navy-400">
            Última atualização: {lastUpdated}
          </span>
        </div>

        {/* Prose content — explicit Tailwind classes since @tailwindcss/typography is not installed */}
        <div
          className="
            [&_h2]:font-sora [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white
            [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pb-2.5
            [&_h2]:border-b [&_h2]:border-navy-700

            [&_h3]:font-sora [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#e8edf3]
            [&_h3]:mt-6 [&_h3]:mb-2

            [&_p]:text-navy-200 [&_p]:text-[15px] [&_p]:leading-7 [&_p]:my-3

            [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5
            [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5
            [&_li]:text-navy-200 [&_li]:text-[15px] [&_li]:leading-7

            [&_strong]:text-white [&_strong]:font-medium

            [&_a]:text-accent [&_a]:no-underline [&_a]:transition-colors [&_a]:duration-150
            hover:[&_a]:underline
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}
