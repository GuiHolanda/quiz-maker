import { EXAM_LANDING_PAGE_MAP } from '@/config/exam-landing-pages';

export const DEMO_PATH = '/demo';
export const DEMO_EXAM_PARAM = 'exam';

// Landing pages whose exam has no catalog template fall back to the full demo
// catalog — a deep link that cannot resolve would strand the visitor on step 1
// with no explanation.
export function demoHrefForSlug(slug: string): string {
  const config = EXAM_LANDING_PAGE_MAP.get(slug);
  return config?.demoExamName ? `${DEMO_PATH}?${DEMO_EXAM_PARAM}=${slug}` : DEMO_PATH;
}

export function demoExamNameForSlug(slug: string | null): string | null {
  if (!slug) return null;
  return EXAM_LANDING_PAGE_MAP.get(slug)?.demoExamName ?? null;
}
