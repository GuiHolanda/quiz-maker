'use client';

import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { Select, SelectItem } from '@heroui/select';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
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

  const onPublicExamChange = (key: any) => {
    const exam = publicExams.find((p) => p.id === key);
    setSelectedPublicExam(exam || null);
    setSelectedSubjects([]);
    setSelectedTopic(null);
  };

  const onSubjectsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = e.target.value;
    if (selectedValues) {
      setSelectedSubjects(selectedValues.split(','));
      setSelectedTopic(null);
    } else {
      setSelectedSubjects([]);
      setSelectedTopic(null);
    }
  };

  const onTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTopic(e.target.value || null);
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
      <Autocomplete
        className={baseColWidth}
        label={t('concurso.selectPublicExam')}
        name="publicExamName"
        onSelectionChange={onPublicExamChange}
        selectedKey={selectedPublicExam?.id ?? ''}
        placeholder={t('concurso.selectPublicExamPlaceholder')}
        {...inputProperties.autocomplete}
      >
        {publicExams.map((exam) => (
          <AutocompleteItem key={exam.id ?? exam.name} textValue={exam.name}>
            {exam.name}
            {exam.examBoard?.name ? ` · ${exam.examBoard.name}` : ''}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      {!noSubjects && (
        <Select
          className={subjectColWidth}
          label={t('concurso.selectSubject')}
          name="subject"
          onChange={onSubjectsChange}
          selectionMode={isMultiple ? 'multiple' : 'single'}
          selectedKeys={selectedSubjects}
          placeholder={t('concurso.selectSubjectPlaceholder')}
          {...inputProperties.select}
        >
          {selectedPublicExam
            ? selectedPublicExam.subjects.map((subject) => (
                <SelectItem key={subject.name}>{subject.name}</SelectItem>
              ))
            : []}
        </Select>
      )}
      {showTopic && (
        <Select
          className="w-1/4"
          label={t('concurso.selectTopic')}
          name="topic"
          onChange={onTopicChange}
          selectionMode="single"
          selectedKeys={selectedTopic ? [selectedTopic] : []}
          placeholder={t('concurso.selectTopicPlaceholder')}
          isDisabled={topicsForCurrentSubject.length === 0}
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
