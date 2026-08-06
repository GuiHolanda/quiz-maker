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

  if (isActive) {
    return (
      <Link
        href={href}
        className="flex items-center px-3 py-2 rounded-lg text-sm font-semibold text-primary bg-primary/10 transition-colors duration-200"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 rounded-lg text-sm text-default-500 hover:text-foreground hover:bg-content2 transition-colors duration-200"
    >
      {label}
    </Link>
  );
}
