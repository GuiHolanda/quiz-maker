"use client";
import { useState } from "react";
import { QuizFormErrors, QuizParams } from "@/types";
import { addToast } from "@heroui/toast";

export function useRequest(requestMethod: (args: any) => Promise<any>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<QuizFormErrors>({});

  const request = async (payload: QuizParams, onSuccess?: () => void) => {
    setLoading(true);
    setError({});

    try {
      const questionare = await requestMethod(payload);
      if (onSuccess) onSuccess();
      return questionare;
    } catch (error: any) {
      setError(error);
      addToast({
        title: `Falha ao gerar questões`,
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, setError, request };
}
