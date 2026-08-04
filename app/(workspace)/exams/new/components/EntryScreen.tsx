'use client';
import { useState } from 'react';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faWandMagicSparkles,
  faCheck,
  faGraduationCap,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAiChatUI } from '@/features/hooks/useAiChatUI.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { AI_CHAT_ALLOWED_PLANS } from '@/config/constants';
import type { ExamType } from '@/shared/types';

interface EntryScreenProps {
  readonly type: ExamType;
  readonly onStartManual: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function EntryScreen({ type, onStartManual }: EntryScreenProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { openChat } = useAiChatUI();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const plan = session?.user?.plan ?? '';
  const hasAiChat = AI_CHAT_ALLOWED_PLANS.includes(plan);

  const listHref = type === 'certification' ? '/exams?type=certification' : '/exams?type=public_exam';
  const listLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');
  const pageTitle = type === 'certification' ? t('exam.newCertificationTitle') : t('exam.newConcursoTitle');
  const newLabel = type === 'certification' ? t('nav.newCertification') : t('nav.newConcurso');
  const heroIcon = type === 'certification' ? faGraduationCap : faClipboardList;

  function handleAiChatPress() {
    if (hasAiChat) {
      openChat();
    } else {
      setIsUpgradeOpen(true);
    }
  }

  const heroBullets = [
    t('exam.entry.heroBullet1'),
    t('exam.entry.heroBullet2'),
    t('exam.entry.heroBullet3'),
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
            <BreadcrumbItem href={listHref}>{listLabel}</BreadcrumbItem>
            <BreadcrumbItem>{newLabel}</BreadcrumbItem>
          </Breadcrumbs>
        }
        title={pageTitle}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {renderHeroPanel()}
          {renderActionCards()}
        </div>
      </PageHeader>

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );

  function renderHeroPanel() {
    return (
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-2 bg-content1 border border-default-200 rounded-xl p-8 flex flex-col gap-6"
        initial={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
          <FontAwesomeIcon className="text-primary" icon={heroIcon} size="xl" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-default-500 leading-relaxed">
            {t('exam.entry.heroSubtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t border-default-200">
          {heroBullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0 mt-0.5">
                <FontAwesomeIcon className="text-success" icon={faCheck} size="xs" />
              </div>
              <span className="text-sm text-default-500">{bullet}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  function renderActionCards() {
    return (
      <div className="lg:col-span-3 flex flex-col gap-4">
        {renderAiChatCard()}
        {renderManualCard()}
      </div>
    );
  }

  function renderAiChatCard() {
    const bullets = [
      t('exam.aiChatCard.bullet1'),
      t('exam.aiChatCard.bullet2'),
      t('exam.aiChatCard.bullet3'),
    ];

    return (
      <motion.div
        animate="visible"
        className="relative bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4"
        custom={0}
        initial="hidden"
        variants={cardVariants}
      >
        {!hasAiChat && (
          <Chip className="absolute top-4 right-4" color="secondary" size="sm" variant="flat">
            PRO AI
          </Chip>
        )}

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0">
            <FontAwesomeIcon className="text-secondary" icon={faRobot} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t('exam.aiChatCard.title')}</h2>
            <p className="text-xs text-default-500">{t('exam.aiChatCard.description')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pl-1">
          {bullets.map((bullet, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-secondary shrink-0" />
              <span className="text-xs text-default-500">{bullet}</span>
            </div>
          ))}
        </div>

        <Button
          className={`${buttonStyles.secondary} w-full justify-center`}
          variant="bordered"
          onPress={handleAiChatPress}
        >
          {t('exam.aiChatCard.cta')}
        </Button>
      </motion.div>
    );
  }

  function renderManualCard() {
    const bullets = [
      t('exam.manualCard.bullet1'),
      t('exam.manualCard.bullet2'),
      t('exam.manualCard.bullet3'),
    ];

    return (
      <motion.div
        animate="visible"
        className="bg-content1 border border-primary/30 rounded-xl p-6 flex flex-col gap-4"
        custom={1}
        initial="hidden"
        variants={cardVariants}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <FontAwesomeIcon className="text-primary" icon={faWandMagicSparkles} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t('exam.manualCard.title')}</h2>
            <p className="text-xs text-default-500">{t('exam.manualCard.description')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pl-1">
          {bullets.map((bullet, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
              <span className="text-xs text-default-500">{bullet}</span>
            </div>
          ))}
        </div>

        <Button
          className={`${buttonStyles.primary} w-full justify-center`}
          data-testid="exam-entry-manual-btn"
          onPress={onStartManual}
        >
          {t('exam.manualCard.cta')}
        </Button>
      </motion.div>
    );
  }
}
