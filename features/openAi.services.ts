import { OPENAI_POST_URL } from "@/config/constants";
import { Questionare } from "@/types";
import api from "@/lib/bff.api";

export async function getQuestions(formData: FormData): Promise<Questionare> {
  const { num_questions, topic, difficulty_distribution } = parseFormData(
    formData,
    ["num_questions", "topic", "difficulty_distribution"]
  );

  const { data } = await api.get<Questionare>(OPENAI_POST_URL, {
    params: {
      num_questions,
      topic,
      easy: 0.20,
      medium: 0.50,
      hard: 0.30,
    },
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
