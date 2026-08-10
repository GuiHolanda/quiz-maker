'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';

import { getAdminCatalog, promoteExamToCatalog } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { AdminCatalogEntry } from '@/shared/types';

export default function AdminCatalogPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AdminCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  useEffect(() => {
    getAdminCatalog()
      .then((res) => setEntries(res.entries))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function handlePromote(examId: string) {
    setPromotingId(examId);
    try {
      await promoteExamToCatalog(examId);
      setEntries((prev) => prev.map((e) => (e.id === examId ? { ...e, isTemplate: true } : e)));
      notify.success(t('admin.catalog.promotedSuccess'));
    } catch {
      notify.error(t('admin.catalog.promotedError'));
    } finally {
      setPromotingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground mb-1">{t('admin.catalog.title')}</h1>
      <p className="text-sm text-default-500 mb-6">{t('admin.catalog.subtitle')}</p>

      {isLoading ? (
        <p className="text-sm text-default-400">Loading...</p>
      ) : (
        <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-content2 border-b border-default-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Exam</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">
                  {t('admin.catalog.ownerColumn')}
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-default-400">
                  {t('admin.catalog.sectionsColumn')}
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-default-400">
                  {t('admin.catalog.questionsColumn')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-default-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-default-200 last:border-0 hover:bg-content2 transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{entry.name}</div>
                    <div className="text-xs text-default-400 mt-0.5">
                      {entry.type === 'certification' ? entry.provider?.name : entry.examBoard?.name}
                      {entry.role && ` — ${entry.role}`}
                      {entry.year && ` (${entry.year})`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-default-500">
                    {entry.ownerEmail ?? <span className="text-default-300 italic">no owner</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-default-500">{entry.sectionCount}</td>
                  <td className="px-4 py-3 text-center text-default-500">{entry.questionCount}</td>
                  <td className="px-4 py-3 text-right">
                    {entry.isTemplate ? (
                      <Chip color="success" size="sm" variant="flat">
                        {t('admin.catalog.alreadyTemplate')}
                      </Chip>
                    ) : (
                      <Button
                        className={buttonStyles.primarySm}
                        isLoading={promotingId === entry.id}
                        size="sm"
                        onPress={() => handlePromote(entry.id)}
                      >
                        {t('admin.catalog.promoteAction')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
