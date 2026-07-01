import {
  getPublicExamBrowseSummary,
  getPublicExamBrowseQuestions,
  deletePublicExamBrowseQuestion,
} from '@/features/connectors';
import { PublicExamBrowseSummary } from '@/shared/types';
import { BrowseDomainConfig } from '@/shared/components/browse/types';

export const publicExamBrowseConfig: BrowseDomainConfig<PublicExamBrowseSummary> = {
  fetchSummary: getPublicExamBrowseSummary,
  mapSummary: (raw) =>
    raw.publicExams.map((exam) => ({
      id: exam.id,
      label: exam.name,
      sublabel: exam.examBoardName,
      totalCount: exam.totalCount,
      children: exam.subjects.map((subject) => ({
        id: subject.name,
        label: subject.name,
        questionCount: subject.questionCount,
      })),
    })),
  fetchQuestions: async (category, subcategory, page, pageSize) => {
    const data = await getPublicExamBrowseQuestions({
      publicExamName: category.label,
      subject: subcategory.label,
      page,
      pageSize,
    });

    return {
      ...data,
      questions: data.questions.map((q) => ({
        ...q,
        primaryLabel: q.examBoardName,
        topicBadge: q.topic,
      })),
    };
  },
  deleteQuestion: deletePublicExamBrowseQuestion,
  i18nPrefix: 'concurso.browse',
};
