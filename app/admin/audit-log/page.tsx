'use client';

import { useState, useEffect, useCallback } from 'react';

import { getAdminAuditLog } from '@/features/connectors';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import type { AdminAuditLogResponse } from '@/shared/types';

const ACTION_LABELS: Record<string, string> = {
  change_plan: 'Mudança de plano',
  set_quota_override: 'Override de quota',
  reset_quota: 'Reset de quota',
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

  useEffect(() => { fetchLog(); }, [fetchLog]);

  return (
    <div style={{ minHeight: '100%' }}>
      <div className="flex items-center gap-3 mb-8">
        <div style={{ width: '2px', height: '20px', background: '#00d4ff', borderRadius: '1px', flexShrink: 0 }} />
        <h1 className="font-sora font-extrabold text-white text-2xl">Audit Log</h1>
      </div>

      <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid rgba(42,79,122,0.4)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(7,14,32,0.8)', borderBottom: '1px solid rgba(42,79,122,0.4)' }}>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Data</th>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Admin</th>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Usuário afetado</th>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Ação</th>
              <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Antes → Depois</th>
            </tr>
          </thead>
          <tbody>
            {(data?.entries ?? []).map((entry) => (
              <tr
                key={entry.id}
                className="last:border-0"
                style={{ background: 'rgba(15,27,61,0.3)', borderBottom: '1px solid rgba(30,58,95,0.4)' }}
              >
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: '#4d87bc' }}>
                  {new Date(entry.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <p className="font-sora font-semibold text-white text-sm">{entry.adminName ?? '—'}</p>
                  <p className="font-mono text-xs" style={{ color: '#6a9fc8' }}>{entry.adminEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-sora font-semibold text-white text-sm">{entry.targetName ?? '—'}</p>
                  <p className="font-mono text-xs" style={{ color: '#6a9fc8' }}>{entry.targetEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(0,212,255,0.08)',
                      border: '1px solid rgba(0,212,255,0.15)',
                      color: '#00d4ff',
                    }}
                  >
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: '#6a9fc8' }}>
                  {entry.before} → {entry.after}
                </td>
              </tr>
            ))}
            {data?.entries.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center font-mono text-sm"
                  style={{ color: '#4d87bc' }}
                >
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
