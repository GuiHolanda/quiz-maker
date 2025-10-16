import { quizReducer, QuizState, QuizAction } from './quiz.reducer.ts';
import { certificationsReducer, CertificationsState, CertificationsAction } from './certifications.reducer.ts';

export type RootState = {
  quiz: QuizState;
  certifications: CertificationsState;
};

export type RootAction = QuizAction | CertificationsAction;

export function rootReducer(state: RootState, action: RootAction): RootState {
  return {
    quiz: quizReducer(state.quiz, action as QuizAction),
    certifications: certificationsReducer(state.certifications, action as CertificationsAction),
  };
}

export default rootReducer;
