'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminNavLinkProps {
  readonly href: string;
  readonly label: string;
}

export function AdminNavLink({ href, label }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const baseClassName =
    'flex items-center px-3 py-2 rounded-lg text-sm font-mono transition-colors duration-200';

  if (isActive) {
    return (
      <Link
        href={href}
        className={`${baseClassName} font-semibold`}
        style={{ color: '#00d4ff', background: 'rgba(30,58,95,0.5)' }}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseClassName} hover:bg-navy-800/40`}
      style={{ color: '#6a9fc8' }}
    >
      {label}
    </Link>
  );
}
