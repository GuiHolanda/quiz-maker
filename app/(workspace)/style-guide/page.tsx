'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Spinner } from '@heroui/spinner';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Tabs, Tab } from '@heroui/tabs';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faTrash,
  faPlus,
  faBell,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimesCircle,
  faXmark,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { buttonStyles } from '@/config/constants/buttonStyles';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { PasswordInput } from '@/shared/components/ui/PasswordInput';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { notify } from '@/shared/lib/notify';
import { StyleGuideSection } from './components/StyleGuideSection';

export default function StyleGuidePage() {
  return <StyleGuideContent />;
}

function StyleGuideContent() {
  const { t } = useTranslation();

  const confirmModal = useDisclosure();
  const formModal = useDisclosure();
  const infoModal = useDisclosure();

  const [formName, setFormName] = useState('');
  const [formSelect, setFormSelect] = useState('');

  return (
    <PageHeader subtitle={t('styleguide.subtitle')} title={t('styleguide.title')}>
      <div className="flex flex-col gap-14">
        {renderColors()}
        {renderTypography()}
        {renderButtons()}
        {renderIconOnlyButtons()}
        {renderInputs()}
        {renderChips()}
        {renderCards()}
        {renderModals()}
        {renderToasters()}
        {renderEmptyStates()}
        {renderLoading()}
        {renderTabs()}
        {renderAccordion()}
      </div>

      {/* ── Confirm Modal ──────────────────────────────────────────── */}
      <Modal isOpen={confirmModal.isOpen} size="sm" onClose={confirmModal.onClose}>
        <ModalContent>
          <ModalHeader>{t('styleguide.demo.confirmTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">{t('styleguide.demo.confirmBody')}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={confirmModal.onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-danger text-white font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faTrash} />}
              onPress={confirmModal.onClose}
            >
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Form Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={formModal.isOpen} size="md" onClose={formModal.onClose}>
        <ModalContent>
          <ModalHeader>{t('styleguide.demo.formTitle')}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4 pb-2">
              <Input
                {...inputProperties.input}
                label="Name"
                placeholder="Enter a name"
                value={formName}
                onValueChange={setFormName}
              />
              <Select
                {...inputProperties.select}
                label="Category"
                placeholder="Select a category"
                selectedKeys={formSelect ? new Set([formSelect]) : new Set()}
                onSelectionChange={(keys) => setFormSelect(Array.from(keys)[0] as string)}
              >
                <SelectItem key="option1">Option 1</SelectItem>
                <SelectItem key="option2">Option 2</SelectItem>
                <SelectItem key="option3">Option 3</SelectItem>
              </Select>
              <Textarea {...inputProperties.input} label="Description" minRows={3} placeholder="Enter a description" />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={formModal.onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faSave} />}
              onPress={formModal.onClose}
            >
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Info Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={infoModal.isOpen} size="lg" onClose={infoModal.onClose}>
        <ModalContent>
          <ModalHeader>{t('styleguide.demo.infoTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">{t('styleguide.demo.infoBody')}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              onPress={infoModal.onClose}
            >
              {t('common.cancel')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageHeader>
  );

  // ── Color Palette ──────────────────────────────────────────────────────────
  function renderColors() {
    const swatches = [
      { label: 'Primary', cls: 'bg-primary', text: 'text-primary-foreground', hex: '#e07820' },
      { label: 'Secondary', cls: 'bg-secondary', text: 'text-secondary-foreground', hex: '#f59e0b' },
      { label: 'Success', cls: 'bg-success', text: 'text-success-foreground', hex: '#3db87a' },
      { label: 'Warning', cls: 'bg-warning', text: 'text-warning-foreground', hex: '#d4a012' },
      { label: 'Danger', cls: 'bg-danger', text: 'text-danger-foreground', hex: '#e05252' },
      { label: 'Default', cls: 'bg-default', text: 'text-default-foreground', hex: 'semantic' },
      { label: 'Content 1', cls: 'bg-content1', text: 'text-foreground', hex: '#0c1832' },
      { label: 'Content 2', cls: 'bg-content2', text: 'text-foreground', hex: '#10203c' },
    ];

    return (
      <StyleGuideSection title={t('styleguide.section.colors')}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {swatches.map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <div
                className={`${s.cls} ${s.text} rounded-xl h-16 flex items-center justify-center border border-default-200`}
              >
                <span className="text-xs font-semibold">{s.hex}</span>
              </div>
              <p className="text-xs font-medium text-foreground text-center">{s.label}</p>
              <p className="text-xs text-default-400 text-center font-mono">{s.cls}</p>
            </div>
          ))}
        </div>
      </StyleGuideSection>
    );
  }

  // ── Typography ────────────────────────────────────────────────────────────
  function renderTypography() {
    return (
      <StyleGuideSection title={t('styleguide.section.typography')}>
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-primary">Page Title</p>
            <h1 className="page-header-title">The quick brown fox jumps over the lazy dog</h1>
            <p className="font-mono text-xs text-default-400">page-header-title · 2rem · 800</p>
          </div>
          <Divider />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-primary">Page Subtitle</p>
            <p className="page-header-subtitle">AI-powered certification exam prep platform for modern learners.</p>
            <p className="font-mono text-xs text-default-400">page-header-subtitle · 0.9rem · 500</p>
          </div>
          <Divider />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-primary">Section Heading (H2)</p>
            <h2 className="text-3xl font-extrabold text-foreground">Section heading</h2>
            <p className="font-mono text-xs text-default-400">text-3xl · font-extrabold · text-foreground</p>
          </div>
          <Divider />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-primary">Card Heading (H3)</p>
            <h3 className="text-xl font-bold text-foreground">Card title</h3>
            <p className="font-mono text-xs text-default-400">text-xl · font-bold · text-foreground</p>
          </div>
          <Divider />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-primary">Section Label</p>
            <p className="text-xs font-semibold text-primary">Section Label</p>
            <p className="font-mono text-xs text-default-400">text-xs · font-semibold · text-primary</p>
          </div>
          <Divider />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-primary">Field Label</p>
            <p className="text-xs font-normal text-default-400">Field label text</p>
            <p className="font-mono text-xs text-default-400">text-xs · font-normal · text-default-400</p>
          </div>
          <Divider />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-primary">Body Text</p>
            <p className="text-sm text-default-500">
              Body text is used for descriptions, help text, and secondary content throughout the interface.
            </p>
            <p className="font-mono text-xs text-default-400">text-sm · text-default-500</p>
          </div>
          <Divider />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-primary">Muted / Caption</p>
            <p className="text-xs text-default-400">Muted text for metadata, timestamps, and auxiliary information.</p>
            <p className="font-mono text-xs text-default-400">text-xs · text-default-400</p>
          </div>
          <Divider />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-primary">Monospace</p>
            <p className="font-mono text-sm text-foreground">const answer = 42; // monospaced font</p>
            <p className="font-mono text-xs text-default-400">font-mono · text-sm</p>
          </div>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Buttons ───────────────────────────────────────────────────────────────
  function renderButtons() {
    const semanticColors = ['primary', 'secondary', 'success', 'warning', 'danger', 'default'] as const;
    const variants = ['solid', 'bordered', 'flat'] as const;

    return (
      <StyleGuideSection title={t('styleguide.section.buttons')}>
        {/* Variants row */}
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-primary">Variants</p>
          <div className="flex flex-wrap gap-3">
            {variants.map((v) => (
              <Button key={v} color="primary" variant={v}>
                {v}
              </Button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-primary">Semantic Colors (solid)</p>
          <div className="flex flex-wrap gap-3">
            {semanticColors.map((c) => (
              <Button key={c} color={c} className='font-semibold text-foreground'>
                {c}
              </Button>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-primary">Sizes</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button color="primary" size="sm">
              Small
            </Button>
            <Button color="primary" size="md">
              Medium
            </Button>
            <Button color="primary" size="lg">
              Large
            </Button>
          </div>
        </div>

        {/* States & Icon buttons */}
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-primary">States & Icons</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faSave} />}
            >
              {t('common.save')}
            </Button>
            <Button
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              isLoading
            >
              Loading…
            </Button>
            <Button className="bg-primary text-primary-foreground font-semibold rounded-lg" isDisabled>
              Disabled
            </Button>
            <Button
              className={buttonStyles.danger}
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faTrash} />}
            >
              {t('common.delete')}
            </Button>
            <Button
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faPlus} />}
            >
              {t('common.generate')}
            </Button>
          </div>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Icon-only Buttons ─────────────────────────────────────────────────────
  function renderIconOnlyButtons() {
    return (
      <StyleGuideSection title={t('styleguide.section.iconOnly')}>
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-primary">Neutral (close / dismiss)</p>
            <p className="text-xs text-default-400 font-mono">
              {'isIconOnly · size="sm" · variant="light" · className={buttonStyles.iconOnly.neutral}'}
            </p>
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                aria-label={t('styleguide.demo.iconOnlyClose')}
                className={buttonStyles.iconOnly.neutral}
                size="sm"
                variant="light"
              >
                <FontAwesomeIcon className="w-3.5 h-3.5" icon={faXmark} />
              </Button>
              <p className="text-xs text-default-500">aria-label: &quot;{t('styleguide.demo.iconOnlyClose')}&quot;</p>
            </div>
          </div>
          <Divider />
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-primary">Primary (confirm / send)</p>
            <p className="text-xs text-default-400 font-mono">
              {'isIconOnly · size="sm" · className={buttonStyles.iconOnly.primary}'}
            </p>
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                aria-label={t('styleguide.demo.iconOnlyConfirm')}
                className={buttonStyles.iconOnly.primary}
                size="sm"
              >
                <FontAwesomeIcon className="w-3.5 h-3.5" icon={faCheck} />
              </Button>
              <p className="text-xs text-default-500">aria-label: &quot;{t('styleguide.demo.iconOnlyConfirm')}&quot;</p>
            </div>
          </div>
          <Divider />
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-primary">Danger (delete / remove)</p>
            <p className="text-xs text-default-400 font-mono">
              {'isIconOnly · size="sm" · variant="light" · className={buttonStyles.iconOnly.danger}'}
            </p>
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                aria-label={t('styleguide.demo.iconOnlyDelete')}
                className={buttonStyles.iconOnly.danger}
                size="sm"
                variant="light"
              >
                <FontAwesomeIcon className="w-3.5 h-3.5" icon={faTrash} />
              </Button>
              <p className="text-xs text-default-500">aria-label: &quot;{t('styleguide.demo.iconOnlyDelete')}&quot;</p>
            </div>
          </div>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Inputs & Forms ────────────────────────────────────────────────────────
  function renderInputs() {
    return (
      <StyleGuideSection title={t('styleguide.section.inputs')}>
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input {...inputProperties.input} label="Text Input" placeholder="Enter text" />
            <Input {...inputProperties.input} label="Email" placeholder="user@example.com" type="email" />
            <Input {...inputProperties.input} label="Number" max={100} min={0} placeholder="0–100" type="number" />
            <PasswordInput label="Password" placeholder="Enter password" />
          </div>
          <Divider />
          <Select {...inputProperties.select} label="Select" placeholder="Choose an option">
            <SelectItem key="opt1">Option 1</SelectItem>
            <SelectItem key="opt2">Option 2</SelectItem>
            <SelectItem key="opt3">Option 3</SelectItem>
          </Select>
          <Divider />
          <Textarea {...inputProperties.input} label="Textarea" minRows={3} placeholder="Enter a longer description…" />
          <Divider />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-primary">Error State</p>
            <Input
              {...inputProperties.input}
              errorMessage="This field is required"
              isInvalid
              label="Input with error"
              placeholder="Enter text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-primary">Disabled State</p>
            <Input
              {...inputProperties.input}
              isDisabled
              label="Disabled input"
              placeholder="Cannot be edited"
              value="Readonly value"
            />
          </div>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Chips & Tags ──────────────────────────────────────────────────────────
  function renderChips() {
    const semanticColors = ['primary', 'secondary', 'success', 'warning', 'danger', 'default'] as const;

    return (
      <StyleGuideSection title={t('styleguide.section.chips')}>
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
          {/* flat */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-primary">Solid</p>
            <div className="flex flex-wrap gap-2">
              {semanticColors.map((c) => (
                <Chip key={c} color={c} size="sm" variant="flat" classNames={{ content: 'px-4 py-2 font-extrabold' }}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
          <Divider />
          {/* Score pattern */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-primary">Score Color Pattern</p>
            <div className="flex flex-wrap gap-2">
              {[
                { score: 85, label: '85% — Success (≥70)' },
                { score: 55, label: '55% — Warning (≥50)' },
                { score: 30, label: '30% — Danger (<50)' },
              ].map(({ score, label }) => (
                <Chip
                  key={score}
                  color={score >= 70 ? 'success' : score >= 50 ? 'warning' : 'danger'}
                  size="sm"
                  variant="flat"
                  classNames={{ content: 'px-4 py-2 font-extrabold' }}
                >
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Cards ─────────────────────────────────────────────────────────────────
  function renderCards() {
    return (
      <StyleGuideSection title={t('styleguide.section.cards')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Standard card */}
          <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-2">
            <h3 className="text-base font-bold text-foreground">Standard Card</h3>
            <p className="text-sm text-default-500">
              This is the standard card pattern used across the application. Uses{' '}
              <span className="font-mono text-xs">bg-content1</span> surface with a subtle border.
            </p>
          </div>

          {/* Card with divider */}
          <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-base font-bold text-foreground">Card with Divider</h3>
              <p className="text-xs text-default-400 mt-1">Header section</p>
            </div>
            <Divider />
            <div className="px-6 py-4">
              <p className="text-sm text-default-500">Body content section separated by a divider.</p>
            </div>
            <Divider />
            <div className="px-6 py-4 flex justify-end gap-2">
              <Button size="sm" variant="bordered">
                {t('common.cancel')}
              </Button>
              <Button
                className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
                size="sm"
              >
                {t('common.save')}
              </Button>
            </div>
          </div>

          {/* Card with icon header */}
          <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <FontAwesomeIcon className="w-4 h-4" icon={faBell} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Icon Header</h3>
                <p className="text-xs text-default-400">Card subtitle</p>
              </div>
            </div>
            <p className="text-sm text-default-500">
              A card with an icon in the header. Useful for feature sections and KPI cards.
            </p>
            <div className="flex gap-2 mt-auto pt-2">
              <Chip color="success" size="sm" variant="flat">
                Active
              </Chip>
              <Chip color="default" size="sm" variant="flat">
                12 items
              </Chip>
            </div>
          </div>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Modals ────────────────────────────────────────────────────────────────
  function renderModals() {
    return (
      <StyleGuideSection title={t('styleguide.section.modals')}>
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
          <p className="text-sm text-default-500">
            Three modal sizes are used in this application. Click to preview each variant.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-danger/10 text-danger border border-danger/20 font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              onPress={confirmModal.onOpen}
            >
              {t('styleguide.demo.confirmModal')} (sm)
            </Button>
            <Button
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faSave} />}
              onPress={formModal.onOpen}
            >
              {t('styleguide.demo.formModal')} (md)
            </Button>
            <Button variant="bordered" onPress={infoModal.onOpen}>
              {t('styleguide.demo.infoModal')} (lg)
            </Button>
          </div>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Toasters / Notifications ───────────────────────────────────────────────
  function renderToasters() {
    return (
      <StyleGuideSection title={t('styleguide.section.toasters')}>
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
          <p className="text-sm text-default-500">
            All notifications use <span className="font-mono text-xs">notify.*</span> from{' '}
            <span className="font-mono text-xs">@/shared/lib/notify</span>. Click to fire each variant.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-success/10 text-success border border-success/20 font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faCheckCircle} />}
              onPress={() => notify.success(t('styleguide.demo.notifySuccess'), t('styleguide.demo.notifySuccessDesc'))}
            >
              notify.success
            </Button>
            <Button
              className="bg-danger/10 text-danger border border-danger/20 font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faTimesCircle} />}
              onPress={() => notify.error(t('styleguide.demo.notifyError'), t('styleguide.demo.notifyErrorDesc'))}
            >
              notify.error
            </Button>
            <Button
              className="bg-warning/10 text-warning border border-warning/20 font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faExclamationTriangle} />}
              onPress={() => notify.warning(t('styleguide.demo.notifyWarning'), t('styleguide.demo.notifyWarningDesc'))}
            >
              notify.warning
            </Button>
            <Button
              className="bg-default-100 text-foreground border border-default-200 font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faInfoCircle} />}
              onPress={() => notify.info(t('styleguide.demo.notifyInfo'), t('styleguide.demo.notifyInfoDesc'))}
            >
              notify.info
            </Button>
          </div>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Empty States ──────────────────────────────────────────────────────────
  function renderEmptyStates() {
    return (
      <StyleGuideSection title={t('styleguide.section.emptyStates')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EmptyState description={t('styleguide.demo.emptyStateDesc')} title={t('styleguide.demo.emptyStateTitle')} />
          <EmptyState
            action={{
              label: t('styleguide.demo.emptyStateCta'),
              onPress: () => notify.info('Demo', 'This would open a creation form.'),
            }}
            description={t('styleguide.demo.emptyStateDesc')}
            title={t('styleguide.demo.emptyStateTitle')}
          />
        </div>
      </StyleGuideSection>
    );
  }

  // ── Loading States ─────────────────────────────────────────────────────────
  function renderLoading() {
    return (
      <StyleGuideSection title={t('styleguide.section.loading')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SkeletonListLoader */}
          <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
            <p className="text-xs font-semibold text-primary">SkeletonListLoader</p>
            <SkeletonListLoader count={3} height="h-12" />
          </div>

          {/* Spinner sizes */}
          <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
            <p className="text-xs font-semibold text-primary">Spinner</p>
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <Spinner color="primary" size="sm" />
                <p className="text-xs text-default-400">sm</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner color="primary" size="md" />
                <p className="text-xs text-default-400">md</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner color="primary" size="lg" />
                <p className="text-xs text-default-400">lg</p>
              </div>
            </div>
          </div>
        </div>

        {/* isLoading button state */}
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-primary">Button Loading State</p>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-primary text-primary-foreground font-semibold rounded-lg" isLoading>
              Saving…
            </Button>
            <Button isLoading variant="bordered">
              Deleting…
            </Button>
            <Button className={buttonStyles.dangerFlat} isLoading>
              Processing…
            </Button>
          </div>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  function renderTabs() {
    return (
      <StyleGuideSection title={t('styleguide.section.tabs')}>
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
          <Tabs
            classNames={{
              tabList: 'bg-default-100 border border-default-200 rounded-xl gap-1 p-1',
              tab: 'text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold rounded-lg',
              cursor: 'bg-content1 shadow-sm rounded-lg',
            }}
          >
            <Tab key="overview" title={t('styleguide.demo.tab1')}>
              <div className="pt-4">
                <p className="text-sm text-default-500">
                  This is the overview tab. Use tabs to organise related content that users need to switch between
                  without leaving the page.
                </p>
              </div>
            </Tab>
            <Tab key="details" title={t('styleguide.demo.tab2')}>
              <div className="pt-4">
                <p className="text-sm text-default-500">
                  Details tab content. Each tab renders its own section without a full page reload.
                </p>
              </div>
            </Tab>
            <Tab key="settings" title={t('styleguide.demo.tab3')}>
              <div className="pt-4">
                <p className="text-sm text-default-500">
                  Settings tab content. Destructive actions like delete should always be placed in a separate tab or
                  confirmation modal.
                </p>
              </div>
            </Tab>
          </Tabs>
        </div>
      </StyleGuideSection>
    );
  }

  // ── Accordion ─────────────────────────────────────────────────────────────
  function renderAccordion() {
    return (
      <StyleGuideSection title={t('styleguide.section.accordion')}>
        <Accordion
          itemClasses={{
            base: 'bg-content1 border border-default-200 rounded-xl',
            title: 'text-sm font-bold text-foreground',
            trigger: 'px-6 py-4 hover:bg-default-100 transition-colors duration-200 rounded-xl',
            content: 'px-6 pb-6 text-sm text-default-500',
            indicator: 'text-default-400',
          }}
          selectionMode="multiple"
        >
          <AccordionItem key="1" aria-label={t('styleguide.demo.accordion1')} title={t('styleguide.demo.accordion1')}>
            {t('styleguide.demo.accordion1Body')}
          </AccordionItem>
          <AccordionItem key="2" aria-label={t('styleguide.demo.accordion2')} title={t('styleguide.demo.accordion2')}>
            {t('styleguide.demo.accordion2Body')}
          </AccordionItem>
          <AccordionItem key="3" aria-label={t('styleguide.demo.accordion3')} title={t('styleguide.demo.accordion3')}>
            {t('styleguide.demo.accordion3Body')}
          </AccordionItem>
        </Accordion>
      </StyleGuideSection>
    );
  }
}
