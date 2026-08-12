'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Skeleton } from '@heroui/skeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faLayerGroup,
  faHashtag,
  faUser,
  faTag,
  faDatabase,
  faChevronRight,
  faClock,
  faCheckCircle,
  faCode,
  faCalendar,
} from '@fortawesome/free-solid-svg-icons';

import { getAdminCatalog, getAdminCatalogExamDetail, promoteExamToCatalog } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { AdminCatalogEntry, AdminCatalogExamDetail } from '@/shared/types';

export default function AdminCatalogPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AdminCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminCatalogExamDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    getAdminCatalog()
      .then((res) => setEntries(res.entries))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setIsDetailLoading(true);
    setDetail(null);
    getAdminCatalogExamDetail(selectedId)
      .then(setDetail)
      .catch(() => notify.error('Erro ao carregar detalhes do exame'))
      .finally(() => setIsDetailLoading(false));
  }, [selectedId]);

  function handleRowClick(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  async function handlePromote(examId: string) {
    setPromotingId(examId);
    try {
      await promoteExamToCatalog(examId);
      setEntries((prev) => prev.map((e) => (e.id === examId ? { ...e, isTemplate: true } : e)));
      if (detail && detail.id === examId) {
        setDetail({ ...detail, isTemplate: true });
      }
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
        <>
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
                {entries.map((entry) => {
                  const isSelected = selectedId === entry.id;
                  return (
                    <tr
                      key={entry.id}
                      className={[
                        'border-b border-default-200 last:border-0 cursor-pointer transition-colors duration-150',
                        isSelected ? 'bg-primary/5' : 'hover:bg-content2',
                      ].join(' ')}
                      onClick={() => handleRowClick(entry.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            className={[
                              'w-3 h-3 transition-transform duration-200',
                              isSelected ? 'rotate-90 text-primary' : 'text-default-300',
                            ].join(' ')}
                            icon={faChevronRight}
                          />
                          <div>
                            <div className="font-semibold text-foreground">{entry.name}</div>
                            <div className="text-xs text-default-400 mt-0.5">
                              {entry.type === 'certification'
                                ? entry.provider?.name
                                : entry.examBoard?.name}
                              {entry.role && ` — ${entry.role}`}
                              {entry.year && ` (${entry.year})`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-default-500">
                        {entry.ownerEmail ?? (
                          <span className="text-default-300 italic">no owner</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-default-500">{entry.sectionCount}</td>
                      <td className="px-4 py-3 text-center text-default-500">{entry.questionCount}</td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(ev) => ev.stopPropagation()}
                      >
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
                  );
                })}
              </tbody>
            </table>
          </div>

          <AnimatePresence>
            {selectedEntry && (
              <motion.div
                key={selectedEntry.id}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4"
              >
                {renderDetailPanel(selectedEntry)}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );

  function renderDetailPanel(entry: AdminCatalogEntry) {
    const referenceEntity = entry.type === 'certification' ? entry.provider : entry.examBoard;
    const logoUrl =
      entry.type === 'certification' ? entry.provider?.logoUrl : entry.examBoard?.logoUrl;

    return (
      <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-default-200 bg-content2">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="w-10 h-10 rounded-lg bg-white border border-default-200 flex items-center justify-center shrink-0 overflow-hidden p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={referenceEntity?.name ?? entry.name}
                  className="w-full h-full object-contain"
                  src={logoUrl}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FontAwesomeIcon className="text-sm text-primary" icon={faLayerGroup} />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{entry.name}</p>
              {referenceEntity?.name && (
                <p className="text-xs text-default-400 mt-0.5">{referenceEntity.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!entry.isTemplate && (
              <Button
                className={buttonStyles.primary}
                isLoading={promotingId === entry.id}
                size="sm"
                onPress={() => handlePromote(entry.id)}
              >
                {t('admin.catalog.promoteAction')}
              </Button>
            )}
            <Button
              isIconOnly
              aria-label="Fechar detalhes"
              className={buttonStyles.iconOnly.neutral}
              size="sm"
              variant="light"
              onPress={() => setSelectedId(null)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-default-200 flex-wrap">
          {entry.isTemplate ? (
            <Chip color="success" size="sm" variant="flat">
              No catálogo
            </Chip>
          ) : (
            <Chip color="default" size="sm" variant="flat">
              Não publicado
            </Chip>
          )}
          <Chip color="default" size="sm" variant="flat">
            {entry.type === 'certification' ? 'Certificação' : 'Concurso'}
          </Chip>

          <Divider className="h-4 w-px bg-default-200" orientation="vertical" />

          <span className="flex items-center gap-1 text-xs text-default-500">
            <FontAwesomeIcon className="w-3 h-3 text-default-400" icon={faLayerGroup} />
            {entry.sectionCount} {entry.sectionCount === 1 ? 'seção' : 'seções'}
          </span>
          <span className="flex items-center gap-1 text-xs text-default-500">
            <FontAwesomeIcon className="w-3 h-3 text-default-400" icon={faHashtag} />
            {detail?.questionCount ?? entry.questionCount} questões salvas
          </span>
          {detail?.totalQuestions != null && (
            <span className="flex items-center gap-1 text-xs text-default-500">
              <FontAwesomeIcon className="w-3 h-3 text-default-400" icon={faHashtag} />
              {detail.totalQuestions} questões configuradas
            </span>
          )}
          {detail && detail.poolQuestionCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-success">
              <FontAwesomeIcon className="w-3 h-3" icon={faDatabase} />
              {detail.poolQuestionCount} no pool
            </span>
          )}

          <Divider className="h-4 w-px bg-default-200" orientation="vertical" />

          {detail?.examDurationMinutes != null && (
            <span className="flex items-center gap-1 text-xs text-default-500">
              <FontAwesomeIcon className="w-3 h-3 text-default-400" icon={faClock} />
              {detail.examDurationMinutes} min
            </span>
          )}
          {detail?.passingScore != null && (
            <span className="flex items-center gap-1 text-xs text-default-500">
              <FontAwesomeIcon className="w-3 h-3 text-default-400" icon={faCheckCircle} />
              aprovação {detail.passingScore}%
            </span>
          )}
          {detail?.key && (
            <span className="flex items-center gap-1 text-xs text-default-500 font-mono">
              <FontAwesomeIcon className="w-3 h-3 text-default-400" icon={faCode} />
              {detail.key}
            </span>
          )}

          {entry.ownerEmail && (
            <>
              <Divider className="h-4 w-px bg-default-200" orientation="vertical" />
              <span className="flex items-center gap-1 text-xs text-default-500">
                <FontAwesomeIcon className="w-3 h-3 text-default-400" icon={faUser} />
                {entry.ownerEmail}
              </span>
            </>
          )}
          {entry.role && (
            <span className="flex items-center gap-1 text-xs text-default-500">
              <FontAwesomeIcon className="w-3 h-3 text-default-400" icon={faTag} />
              {entry.role}
              {entry.year && ` — ${entry.year}`}
            </span>
          )}
          {detail?.createdAt && (
            <>
              <Divider className="h-4 w-px bg-default-200" orientation="vertical" />
              <span className="flex items-center gap-1 text-xs text-default-400">
                <FontAwesomeIcon className="w-3 h-3" icon={faCalendar} />
                criado {new Date(detail.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </>
          )}
        </div>

        {/* Sections */}
        <div className="px-6 py-4">
          {isDetailLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg w-full" />
              ))}
            </div>
          ) : !detail || detail.sections.length === 0 ? (
            <p className="text-xs text-default-400 italic">Nenhuma seção cadastrada</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {detail.sections.map((section) => (
                <div
                  key={section.id}
                  className="bg-content2 border border-default-200 rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">{section.name}</p>
                    <span className="text-xs text-default-400 shrink-0">
                      {section.minQuestions}–{section.maxQuestions}%
                    </span>
                  </div>
                  {section.topics && section.topics.length > 0 ? (
                    <ul className="mt-1.5 space-y-0.5">
                      {section.topics.map((topic) => (
                        <li
                          key={topic.id}
                          className="text-xs text-default-500 pl-2 before:content-['·'] before:mr-1.5 before:text-default-300"
                        >
                          {topic.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-default-400 mt-0.5 italic">Sem tópicos</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
