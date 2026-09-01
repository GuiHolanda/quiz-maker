import type { PromptDefinition } from '../types';
import { correctCountRange, resolveQuestionFormat } from '@/config/question-formats';
import type { QuestionFormatKey } from '@/config/question-formats';
import { promptLanguageName } from '@/config/generation-languages';
import type { GenerationLanguage } from '@/config/generation-languages';

export interface CertificationQuestionsResearchInput {
  readonly certification_name: string;
  readonly topic_name: string;
  readonly num_questions: string;
  readonly topics_list?: string;
  readonly format?: QuestionFormatKey;
  readonly language?: GenerationLanguage;
}

export const certificationQuestionsResearchPrompt = {
  build: (input: CertificationQuestionsResearchInput): string => {
    const { certification_name, topic_name, num_questions, topics_list } = input;
    const format = resolveQuestionFormat(input.format);
    const languageName = promptLanguageName(input.language ?? 'pt');
    const topicsBlock = topics_list
      ? `\nSub-topics to cover (distribute questions across these):\n${topics_list}\n`
      : '';

    return `You are an expert exam question writer for professional certification exams across any domain (technology, finance, engineering, healthcare, law, and others).

## STEP 1 — RESEARCH

Search the web for real exam questions from the "${certification_name}" certification about the topic "${topic_name}". Use queries like:
- "${certification_name} exam questions ${topic_name} sample"
- "${certification_name} ${topic_name} practice questions"

Analyze found questions to identify: question style, common distractors, key concepts tested, and typical difficulty level for this certification.

## STEP 2 — GENERATE

Based on the research, write exactly ${num_questions} **original** questions (do not copy found questions) for:
- Certification: ${certification_name}
- Topic: ${topic_name}${topicsBlock}

Rules:
1. Write every question — the stem and all options — in ${languageName}. Every question in this set must be entirely in ${languageName}; never mix languages within a question or across the set, regardless of the language the "${certification_name}" exam normally uses.
2. Reflect the style identified in research (vocabulary, typical distractors, depth).
3. Only factually correct content based on current official documentation or standards.
4. Do NOT indicate the correct answer.
5. Each question must be self-contained.
6. correctCount must be between 1 and ${format.maxCorrect}. Vary across the set when the format allows more than one.
7. ${format.draftRule}
8. Vary difficulty: mix easy, medium, and hard questions.
9. Favor scenario-based questions over pure recall when the domain allows.
10. Never use "All of the above" or "None of the above".

## OUTPUT FORMAT

Write each question in the following structured plain-text format. Do not use JSON. Do not add any extra text before or after the list.

---
QUESTION 1
certificationTitle: ${certification_name}
topic: ${topic_name}
difficulty: <easy|medium|hard>
correctCount: <${correctCountRange(format)}>
text: <question text>
${format.draftTemplate}
---
QUESTION 2
...`;
  },
} satisfies PromptDefinition<CertificationQuestionsResearchInput>;
