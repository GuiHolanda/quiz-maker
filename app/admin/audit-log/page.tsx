'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chip } from '@heroui/chip';

import { getAdminAuditLog } from '@/features/connectors';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import type { AdminAuditLogResponse } from '@/shared/types';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';

const ACTION_LABELS: Record<string, string> = {
  change_plan: 'Mudança de plano',
  set_quota_override: 'Override de quota',
  reset_quota: 'Reset de quota',
};

const ACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  change_plan: 'primary',
  set_quota_override: 'warning',
  reset_quota: 'secondary',
};

const PAGE_SIZE = 20;

export default function AdminAuditLogPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminAuditLogResponse | null>(null);
  const [page, setPage] = useState(1);

  const fetchLog = useCallback(async () => {
    try {
      const result = await getAdminAuditLog({ page, limit: PAGE_SIZE });
      setData(result);
    } catch {
      notify.error(t('admin.auditLogLoadFailed'), t('admin.auditLogLoadFailedDescription'));
    }
  }, [page, t]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  return (
    <div>
      <h1 className="page-header-title text-foreground mb-2">Audit Log</h1>
      <p className="text-sm text-default-500 mb-8">Histórico de ações administrativas</p>

      <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-divider bg-content2">
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Data</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Admin</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Usuário afetado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Ação</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Antes → Depois</th>
            </tr>
          </thead>
          <tbody>
            {(data?.entries ?? []).map((entry) => (
              <tr key={entry.id} className="border-b border-divider last:border-0">
                <td className="px-4 py-3 text-xs text-default-400 whitespace-nowrap">
                  <RelativeDate date={entry.createdAt} />
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground text-sm">{entry.adminName ?? '—'}</p>
                  <p className="text-xs text-default-400">{entry.adminEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground text-sm">{entry.targetName ?? '—'}</p>
                  <p className="text-xs text-default-400">{entry.targetEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <Chip size="sm" variant="flat" color={ACTION_COLORS[entry.action] ?? 'default'}>
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </Chip>
                </td>
                <td className="px-4 py-3 text-xs text-default-500">
                  {entry.before} → {entry.after}
                </td>
              </tr>
            ))}
            {data?.entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-default-400">
                  Nenhuma ação registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <PaginationControls currentPage={page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
