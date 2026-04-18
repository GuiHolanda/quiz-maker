"use client";
import { useState } from "react";
import { QuizFormErrors, QuizParams } from "@/types";
import { addToast } from "@heroui/toast";

export function useRequest(requestMethod: (args: any) => Promise<any>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<QuizFormErrors>({});

  const request = async (payload: any, onSuccess?: () => void) => {
    setLoading(true);
    setError({});

    try {
      const questionare = await requestMethod(payload);
      if (onSuccess) onSuccess();
      return questionare;
    } catch (error: any) {
      queueMicrotask(() => setError(error));
      addToast({
        title: `Failed to load questions`,
        description: error?.response?.data?.message || "Something went wrong. Please try again.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, setError, request };
}
