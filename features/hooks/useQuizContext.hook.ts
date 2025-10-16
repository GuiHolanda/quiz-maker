import { useContext } from 'react';
import { QuizContext } from '../providers/quiz.provider';

export function useQuizContext() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuizContext must be used within a QuizProvider');
  return ctx;
}
export default useQuizContext;