'use client';

import { Select, SelectItem } from '@heroui/select';
import type { Selection } from '@react-types/shared';

import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface PublicExamManagerProps extends React.HTMLAttributes<HTMLDivElement> {
  isMultiple?: boolean;
  noSubjects?: boolean;
  showTopic?: boolean;
}

export const PublicExamManager = ({ isMultiple, noSubjects, showTopic, ...props }: PublicExamManagerProps) => {
  const { t } = useTranslation();
  const {
    publicExams,
    selectedPublicExam,
    selectedSubjects,
    selectedTopic,
    setSelectedPublicExam,
    setSelectedSubjects,
    setSelectedTopic,
  } = usePublicExamsContext();

  const onPublicExamChange = (keys: Selection) => {
    if (keys === 'all') return;
    const key = Array.from(keys as Set<React.Key>)[0];
    const exam = publicExams.find((p) => (p.id ?? p.name) === String(key));

    setSelectedPublicExam(exam || null);
    setSelectedSubjects([]);
    setSelectedTopic(null);
  };

  const onSubjectsChange = (keys: Selection) => {
    if (keys === 'all') return;
    const next = Array.from(keys as Set<React.Key>).map(String);

    setSelectedSubjects(next);
    setSelectedTopic(null);
  };

  const onTopicChange = (keys: Selection) => {
    if (keys === 'all') return;
    const key = Array.from(keys as Set<React.Key>)[0];

    setSelectedTopic(key ? String(key) : null);
  };

  // Topics for the currently selected single subject (only when not multi-subject).
  const currentSubject =
    !isMultiple && selectedSubjects[0]
      ? selectedPublicExam?.subjects.find((s) => s.name === selectedSubjects[0])
      : null;
  const topicsForCurrentSubject = currentSubject?.topics ?? [];

  const baseColWidth = noSubjects ? 'w-full' : showTopic ? 'w-1/2' : 'w-2/3';
  const subjectColWidth = showTopic ? 'w-1/4' : 'w-1/3';

  return (
    <div className={props.className} {...props}>
      <Select
        autoComplete="off"
        className={baseColWidth}
        label={t('concurso.selectPublicExam')}
        name="publicExamName"
        placeholder={t('concurso.selectPublicExamPlaceholder')}
        selectedKeys={selectedPublicExam ? [selectedPublicExam.id ?? selectedPublicExam.name] : []}
        onSelectionChange={onPublicExamChange}
        {...inputProperties.select}
      >
        {publicExams.map((exam) => {
          const label = [exam.name, exam.role, exam.examBoard?.name].filter(Boolean).join(' · ');

          return (
            <SelectItem key={exam.id ?? exam.name} textValue={label}>
              {label}
            </SelectItem>
          );
        })}
      </Select>
      {!noSubjects && (
        <Select
          className={subjectColWidth}
          label={t('concurso.selectSubject')}
          name="subject"
          placeholder={t('concurso.selectSubjectPlaceholder')}
          selectedKeys={selectedSubjects}
          selectionMode={isMultiple ? 'multiple' : 'single'}
          onSelectionChange={onSubjectsChange}
          {...inputProperties.select}
        >
          {selectedPublicExam
            ? selectedPublicExam.subjects.map((subject) => <SelectItem key={subject.name}>{subject.name}</SelectItem>)
            : []}
        </Select>
      )}
      {showTopic && (
        <Select
          className="w-1/4"
          isDisabled={topicsForCurrentSubject.length === 0}
          label={t('concurso.selectTopic')}
          name="topic"
          placeholder={t('concurso.selectTopicPlaceholder')}
          selectedKeys={selectedTopic ? [selectedTopic] : []}
          selectionMode="single"
          onSelectionChange={onTopicChange}
          {...inputProperties.select}
        >
          {topicsForCurrentSubject.map((topic) => (
            <SelectItem key={topic.name}>{topic.name}</SelectItem>
          ))}
        </Select>
      )}
    </div>
  );
};
