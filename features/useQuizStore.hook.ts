import { useReducer, useEffect, useCallback } from "react";
import type { AnswersMap, QuizPayload } from "@/types";
import { QUIZ_LOCAL_STORAGE_KEY } from "@/config/constants";


type State = QuizPayload | null;
type Action =
  | { type: "init"; payload: QuizPayload }
  | { type: "setAnswers"; payload: { answers: AnswersMap } }
  | { type: "replace"; payload: QuizPayload }
  | { type: "clear" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "init":
      return action.payload;
    case "setAnswers":
      if (!state || state.questions.length === 0) return state;
      return { ...state, answers: action.payload.answers };
    case "replace":
      return action.payload;
    case "clear":
      return null;
    default:
      return state;
  }
}

export function useQuizStore() {
  const [state, dispatch] = useReducer(reducer, null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_LOCAL_STORAGE_KEY);
      if (raw) dispatch({ type: "init", payload: JSON.parse(raw) as QuizPayload });
    } catch (err) {
      console.warn("Failed to read quiz from storage", err);
    }
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(QUIZ_LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Persist quiz failed", err);
    }
  }, [state]);

  const setAnswers = useCallback((answers: AnswersMap) => {
    dispatch({ type: "setAnswers", payload: { answers } });
  }, []);

  const replaceQuiz = useCallback((payload: QuizPayload) => {
    dispatch({ type: "replace", payload });
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(QUIZ_LOCAL_STORAGE_KEY);
    } catch {}
    dispatch({ type: "clear" });
  }, []);

  return { quiz: state, setAnswers, replaceQuiz, clear };
}
