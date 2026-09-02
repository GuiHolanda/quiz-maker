'use client';

import { faGraduationCap, faLayerGroup } from '@fortawesome/free-solid-svg-icons';

import { SimuladoHistoryModal } from './SimuladoHistoryModal';
import { SimuladosPagination } from './SimuladosPagination';
import { SimuladosTable } from './SimuladosTable';
import { SimuladosToolbar } from './SimuladosToolbar';
import { useSimuladoActions } from './useSimuladoActions.hook';
import { useSimuladosList } from './useSimuladosList.hook';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { IconBadge } from '@/shared/components/ui/IconBadge';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';

export function SimuladosCreatedSection() {
  const { t } = useTranslation();
  const list = useSimuladosList();
  const actions = useSimuladoActions();

  return (
    <section className="border-t border-divider pt-8">
      <div className="flex items-start gap-3.5">
        <IconBadge icon={faLayerGroup} />
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold text-foreground">{t('simulado.table.sectionTitle')}</h2>
          <p className="max-w-[820px] text-sm text-default-500">{t('simulado.table.sectionSubtitle')}</p>
        </div>
      </div>

      {renderBody()}

      <ConfirmModal
        body={
          <p className="text-sm text-default-500">
            {t('simulado.deleteConfirm', {
              name: actions.deleteTarget?.name ?? actions.deleteTarget?.sourceLabel ?? '',
            })}
          </p>
        }
        confirmLabel={t('common.delete')}
        confirmTestId="confirm-delete-btn"
        isLoading={actions.isDeleting}
        isOpen={!!actions.deleteTarget}
        title={t('simulado.deleteTitle')}
        onClose={() => actions.setDeleteTarget(null)}
        onConfirm={actions.handleDelete}
      />

      <SimuladoHistoryModal simulado={actions.historyTarget} onClose={() => actions.setHistoryTarget(null)} />
    </section>
  );

  function renderBody() {
    if (list.isLoading) {
      return (
        <div className="mt-6">
          <SkeletonListLoader count={5} height="h-14" />
        </div>
      );
    }

    if (list.isEmpty) {
      return (
        <div className="mt-6">
          <IllustratedEmptyState
            description={t('simulado.noSimuladosDescription')}
            icon={faGraduationCap}
            title={t('simulado.noSimulados')}
          />
        </div>
      );
    }

    return (
      <>
        <div className="mt-6">
          <SimuladosToolbar
            exam={list.exam}
            examOptions={list.examOptions}
            hasActiveFilters={list.hasActiveFilters}
            perPage={list.perPage}
            search={list.search}
            sort={list.sort}
            status={list.status}
            onClear={list.clearFilters}
            onExam={list.setExam}
            onPerPage={list.setPerPage}
            onSearch={list.setSearch}
            onSort={list.setSort}
            onStatus={list.setStatus}
          />
        </div>

        <div className="mt-4">
          <SimuladosTable
            rows={list.pageItems}
            startingKey={actions.startingKey}
            onDelete={actions.setDeleteTarget}
            onDuplicate={actions.handleDuplicate}
            onOpenHistory={actions.setHistoryTarget}
            onStart={actions.handleStart}
            onViewResult={actions.viewResult}
          />
        </div>

        <SimuladosPagination
          from={list.from}
          page={list.page}
          pageNumbers={list.pageNumbers}
          to={list.to}
          total={list.total}
          totalPages={list.totalPages}
          onPage={list.setPage}
        />
      </>
    );
  }
}
