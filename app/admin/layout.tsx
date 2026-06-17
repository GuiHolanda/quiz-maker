import { redirect } from 'next/navigation';
import Link from 'next/link';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (dbUser?.plan !== 'admin') redirect('/');

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 shrink-0 border-r border-divider bg-content1 flex flex-col">
        <div className="px-5 py-5 border-b border-divider">
          <span className="text-sm font-bold text-foreground">⚙ Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-2 flex-1">
          <AdminNavLink href="/admin/overview" label="Visão Geral" />
          <AdminNavLink href="/admin/users" label="Usuários" />
          <AdminNavLink href="/admin/analytics" label="Analytics" />
          <AdminNavLink href="/admin/audit-log" label="Audit Log" />
        </nav>
        <div className="p-4 border-t border-divider">
          <Link
            href="/"
            className="text-xs text-default-400 hover:text-foreground transition-colors duration-200"
          >
            ← Voltar ao app
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

function AdminNavLink({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm text-default-500 hover:text-foreground hover:bg-default-100 transition-colors duration-200"
    >
      {label}
    </Link>
  );
}
