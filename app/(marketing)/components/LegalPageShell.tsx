import NextLink from 'next/link';

interface LegalPageShellProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly children: React.ReactNode;
}

export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  return (
    <div className="bg-navy-900 text-[#e8edf3] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <nav className="mb-8 text-xs text-navy-500 flex items-center gap-2">
          <NextLink className="hover:text-white transition-colors" href="/">
            Início
          </NextLink>
          <span>/</span>
          <span className="text-navy-400">{title}</span>
        </nav>
        <div className="mb-10">
          <h1 className="text-3xl font-sora font-bold text-white mb-3">{title}</h1>
          <p className="text-xs text-navy-500">Última atualização: {lastUpdated}</p>
        </div>
        <div className="prose prose-invert prose-sm max-w-none
          prose-headings:font-sora prose-headings:text-white prose-headings:font-semibold
          prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-navy-800 prose-h2:pb-2
          prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-[#e8edf3]
          prose-p:text-navy-300 prose-p:leading-relaxed prose-p:my-3
          prose-li:text-navy-300 prose-li:my-1
          prose-ul:my-3 prose-ul:list-disc prose-ul:pl-5
          prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-5
          prose-strong:text-white prose-strong:font-medium
          prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
          {children}
        </div>
      </div>
    </div>
  );
}
