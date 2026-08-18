import type { Exam, ExamSection } from '@/shared/types';

export interface ParsedCertResponse {
  context: string;
  sources: string[];
  examDraft: Exam;
}

// Extracts and validates the ```certification-data``` JSON block the AI_CHAT_TOPICS_PROMPT
// (config/prompts/ai-chat-topics.prompt.ts) emits once a certification is confirmed, and maps
// it onto the Exam draft shape. Shared by the chat drawer (useAiChat.hook.ts) and the
// headless certification-identify flow on /exams/new — both talk to the same /api/ai/ai-chat
// endpoint and must parse its output the same way.
export function parseCertificationData(text: string): ParsedCertResponse | null {
  const match = /```certification-data\s*\n([\s\S]*?)```/.exec(text);

  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    const cert = parsed.certificationData;

    if (!cert?.label || !cert?.key || !Array.isArray(cert?.topics)) return null;
    if (
      !cert.topics.every(
        (t: unknown) =>
          typeof (t as Record<string, unknown>).name === 'string' &&
          typeof (t as Record<string, unknown>).minQuestions === 'number' &&
          typeof (t as Record<string, unknown>).maxQuestions === 'number'
      )
    )
      return null;

    const sections: ExamSection[] = cert.topics.map((topic: Record<string, unknown>) => ({
      name: topic.name as string,
      minQuestions: topic.minQuestions as number,
      maxQuestions: topic.maxQuestions as number,
      topics: [],
    }));

    const examDraft: Exam = {
      type: 'certification',
      name: cert.label,
      key: cert.key as string,
      role: null,
      year: typeof cert.year === 'number' ? cert.year : null,
      totalQuestions: typeof cert.totalQuestions === 'number' ? cert.totalQuestions : 0,
      examDurationMinutes: typeof cert.examDurationMinutes === 'number' ? cert.examDurationMinutes : null,
      passingScore: typeof cert.passingScore === 'number' ? cert.passingScore : null,
      provider: cert.provider ? { name: String(cert.provider) } : null,
      examBoard: null,
      sections,
    };

    return {
      context: typeof parsed.context === 'string' ? parsed.context : '',
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      examDraft,
    };
  } catch {
    return null;
  }
}
