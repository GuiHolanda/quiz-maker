import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { PROMPT_CONFIG, response01 } from "@/config/constants";
import { buildPrompt } from "@/features/openAi.services";
import { QuestionService } from "@/services/question.service";
import { Questionare } from "@/types";
import { parseNumber, safeJsonParse } from "@/utils";

const questionService = new QuestionService();

export async function GET(request: NextRequest) {
  debugger;
  const url = new URL(request.url);
  const params = url.searchParams;

  const topic = params.get("topic")?.trim() ?? "";
  const num_questions = parseNumber(params.get("num_questions"), 10) ?? 10;
  const easy = parseNumber(params.get("easy"), 0);
  const medium = parseNumber(params.get("medium"), 0);
  const hard = parseNumber(params.get("hard"), 0);

  if (!Number.isInteger(num_questions) || num_questions <= 0) {
    return NextResponse.json(
      { error: "num_questions must be an integer > 0" },
      { status: 400 }
    );
  }

  const difficulty_distribution = {
    easy: Number(easy) || 0,
    medium: Number(medium) || 0,
    hard: Number(hard) || 0,
  };

  const prompt = buildPrompt(PROMPT_CONFIG, {
    num_questions: String(num_questions),
    topic,
    difficulty_distribution,
  });

  let payload: Questionare | null = null;

  const parsedResponse = safeJsonParse<Questionare>(response01);
  if (!parsedResponse.ok) {
    console.error("Response is not valid JSON:", parsedResponse.error);
    return NextResponse.json(
      { error: "invalid response JSON" },
      { status: 500 }
    );
  }
  payload = parsedResponse.value;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey });
  // Minimal wrapper in case you later switch to real responses.create usage
  // For now the real call is left commented; replace with client.responses.create when ready.
  // const aiResponse = await client.responses.create({ model: 'gpt-5-nano', input: prompt });
  // payload = extractPayloadFromAiResponse(aiResponse);

  //return NextResponse.json({ error: "real OpenAI call not implemented in this route - use mock=1 for now" }, { status: 501 });

  // Basic payload validation
  if (
    !payload ||
    !Array.isArray(payload.questions) ||
    payload.questions.length === 0
  ) {
    return NextResponse.json(
      { error: "Payload has no questions" },
      { status: 400 }
    );
  }

  try {
    const created = await questionService.createFromPayload(payload);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("Failed to persist generated questions:", err);
    return NextResponse.json(
      { error: "Failed to persist generated questions" },
      { status: 500 }
    );
  }
}
