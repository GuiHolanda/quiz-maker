import type { BrowseQuestion } from '@/shared/components/QuestionBrowseList';

export interface BrowseCategoryNode {
  readonly id: string;
  readonly label: string;
  readonly sublabel?: string;
  readonly totalCount: number;
  readonly children: readonly BrowseSubcategoryNode[];
}

export interface BrowseSubcategoryNode {
  readonly id: string;
  readonly label: string;
  readonly questionCount: number;
}

export interface BrowseLeafSelection {
  readonly categoryId: string;
  readonly subcategoryId: string;
}

export interface BrowseFetchPageResult {
  readonly questions: BrowseQuestion[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface BrowseDomainConfig<TSummary> {
  readonly fetchSummary: () => Promise<TSummary>;
  readonly mapSummary: (raw: TSummary) => BrowseCategoryNode[];
  readonly fetchQuestions: (
    category: BrowseCategoryNode,
    subcategory: BrowseSubcategoryNode,
    page: number,
    pageSize: number,
  ) => Promise<BrowseFetchPageResult>;
  readonly deleteQuestion: (id: number) => Promise<void>;
  readonly i18nPrefix: 'browse' | 'concurso.browse';
}
