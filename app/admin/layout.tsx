import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminNavLink } from '@/app/admin/components/AdminNavLink';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (dbUser?.plan !== 'admin') redirect('/');

  return (
    <div className="flex min-h-screen bg-background2">
      <aside className="w-56 shrink-0 flex flex-col bg-background2 border-r border-divider">
        <div className="py-5 px-5 flex items-center gap-2.5 border-b border-divider">
          <span className="rounded-lg p-1.5 bg-primary/10 border border-primary/20">
            <FontAwesomeIcon icon={faGear} className="w-3.5 h-3.5 text-primary" />
          </span>
          <span className="font-semibold text-foreground text-sm">Admin</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          <AdminNavLink href="/admin/overview" label="Visão Geral" />
          <AdminNavLink href="/admin/users" label="Usuários" />
          <AdminNavLink href="/admin/analytics" label="Analytics" />
          <AdminNavLink href="/admin/audit-log" label="Audit Log" />
        </nav>
        <div className="p-4 border-t border-divider">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-default-400 hover:text-foreground transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 shrink-0" />
            Voltar ao app
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto bg-background">{children}</main>
    </div>
  );
}
