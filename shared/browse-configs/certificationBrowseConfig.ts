import { getBrowseSummary, getBrowseQuestions, deleteBrowseQuestion } from '@/features/connectors';
import { BrowseSummary } from '@/shared/types';
import { BrowseDomainConfig } from '@/shared/components/browse/types';

export const certificationBrowseConfig: BrowseDomainConfig<BrowseSummary> = {
  fetchSummary: getBrowseSummary,
  mapSummary: (raw) =>
    raw.certifications.map((cert) => ({
      id: cert.key,
      label: cert.label,
      totalCount: cert.totalCount,
      children: cert.topics.map((topic) => ({
        id: topic.name,
        label: topic.name,
        questionCount: topic.questionCount,
      })),
    })),
  fetchQuestions: async (category, subcategory, page, pageSize) => {
    const data = await getBrowseQuestions({
      certificationTitle: category.label,
      topic: subcategory.label,
      page,
      pageSize,
    });

    return {
      ...data,
      questions: data.questions.map((q) => ({ ...q, primaryLabel: q.certificationTitle })),
    };
  },
  deleteQuestion: deleteBrowseQuestion,
  i18nPrefix: 'browse',
};
