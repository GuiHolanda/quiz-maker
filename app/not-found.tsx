import NextLink from 'next/link';
import { Button } from '@heroui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-900 text-[#e8edf3] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-mono text-xs text-navy-400 mb-4">404</p>
        <h1 className="font-sora font-extrabold text-white text-3xl sm:text-4xl mb-4">Página não encontrada</h1>
        <p className="text-navy-400 text-base mb-8">A página que você está procurando não existe ou foi movida.</p>
        <Button
          as={NextLink}
          href="/"
          className="font-semibold text-sm bg-accent hover:bg-electric text-navy-950 rounded tracking-wide transition-colors duration-200"
          size="lg"
        >
          Voltar ao início
        </Button>
      </div>
    </div>
  );
}
