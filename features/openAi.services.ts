import { OPENAI_POST_URL } from "@/config/constants";
import api from "@/lib/bff.api";
import { RequestBody } from "@/types";

export async function postPrompt(formData: FormData) {
  const { num_questions, topic, difficulty_distribution } = parseFormData(
    formData,
    ["num_questions", "topic", "difficulty_distribution"]
  );

  const { data } = await api.post(OPENAI_POST_URL, {
    num_questions,
    topic,
    difficulty_distribution,
  });

  return data;
}

function parseFormData(formData: FormData, fields: string[]) {
  const data: Record<string, string> = {};

  fields.forEach((field) => {
    const value = formData.get(field);

    if (typeof value === "string") data[field] = value;
  });

  return data;
}
