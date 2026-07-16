import OpenAI from 'openai';

export interface JudgeScore {
  distractorQuality: number;
  answerClarity: number;
  technicalAccuracy: number;
  difficulty: number;
  overall: number;
}

export interface QuestionSample {
  text: string;
  options: Record<string, string>;
  correctCount: number;
}

const JUDGE_MODEL = 'gpt-5.6-sol';

const JUDGE_SYSTEM_PROMPT = `You are an expert exam quality evaluator. You will receive a multiple-choice question and evaluate it objectively across 4 criteria, scoring each from 0 to 10.

Criteria:
1. distractorQuality (0-10): Are the wrong answer options plausible but clearly incorrect on reflection? High score = distractors are believable, not trivially wrong.
2. answerClarity (0-10): Is the correct answer unambiguous? No room for debate? High score = exactly one defensible answer.
3. technicalAccuracy (0-10): Is the content factually correct and technically precise for the domain? High score = no errors or outdated information.
4. difficulty (0-10): Is the difficulty appropriate for a professional certification or public exam? High score = appropriately challenging, not trivial.

Respond ONLY with a JSON object in this exact format, no text before or after:
{"distractorQuality": 8, "answerClarity": 9, "technicalAccuracy": 8, "difficulty": 7}`;

export async function judgeQuestion(
  question: QuestionSample,
  domainLabel: string,
  openAIClient: OpenAI
): Promise<JudgeScore> {
  const optionsText = Object.entries(question.options)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const userMessage = `Domain: ${domainLabel}
Expected correct options: ${question.correctCount}

Question:
${question.text}

Options:
${optionsText}

Evaluate this question.`;

  const response = await openAIClient.chat.completions.create({
    model: JUDGE_MODEL,
    messages: [
      { role: 'system', content: JUDGE_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as Partial<JudgeScore>;

  const distractorQuality = Number(parsed.distractorQuality ?? 0);
  const answerClarity = Number(parsed.answerClarity ?? 0);
  const technicalAccuracy = Number(parsed.technicalAccuracy ?? 0);
  const difficulty = Number(parsed.difficulty ?? 0);
  const overall = (distractorQuality + answerClarity + technicalAccuracy + difficulty) / 4;

  return { distractorQuality, answerClarity, technicalAccuracy, difficulty, overall };
}
