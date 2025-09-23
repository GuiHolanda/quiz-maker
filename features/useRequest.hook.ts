import { useRouter } from "next/router";
import { useState } from "react";
import { postPrompt } from "./openAi.services";

export function useRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const request = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await postPrompt(formData);
      if (!result.ok) {
        throw new Error("Network result was not ok");
      }
      return await result.json();
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, request };
}
