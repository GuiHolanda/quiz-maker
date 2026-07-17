import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminNavLink } from '@/app/admin/components/AdminNavLink';

export default async function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (dbUser?.plan !== 'admin') redirect('/');

  return (
    <div className="flex min-h-screen" style={{ background: '#070e20' }}>
      <aside
        className="w-56 shrink-0 flex flex-col"
        style={{ background: '#0f1b3d', borderRight: '1px solid rgba(30,58,95,0.6)' }}
      >
        <div
          className="py-5 px-5 flex items-center gap-2.5"
          style={{ borderBottom: '1px solid rgba(30,58,95,0.6)' }}
        >
          <span
            className="rounded p-1.5"
            style={{
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.15)',
            }}
          >
            <FontAwesomeIcon icon={faGear} className="w-3.5 h-3.5" style={{ color: '#00d4ff' }} />
          </span>
          <span className="font-sora font-bold text-white text-sm tracking-tight">Admin</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          <AdminNavLink href="/admin/overview" label="Visão Geral" />
          <AdminNavLink href="/admin/users" label="Usuários" />
          <AdminNavLink href="/admin/analytics" label="Analytics" />
          <AdminNavLink href="/admin/audit-log" label="Audit Log" />
        </nav>
        <div className="p-4" style={{ borderTop: '1px solid rgba(30,58,95,0.6)' }}>
          <Link
            href="/"
            className="flex items-center gap-1.5 font-mono text-xs transition-colors duration-200 hover:text-white"
            style={{ color: '#6a9fc8' }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 shrink-0" />
            Voltar ao app
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto" style={{ background: '#070e20' }}>{children}</main>
    </div>
  );
}
