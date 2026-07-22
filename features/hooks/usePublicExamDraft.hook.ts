import { useEffect, useState } from 'react';

import { PublicExamSubject } from '@/shared/types';

const STORAGE_KEY = 'NEW_PUBLIC_EXAM_DRAFT';

interface PublicExamDraft {
  name: string;
  role: string;
  year: string;
  examBoardName: string;
  totalQuestions: string;
  examDurationMinutes: string;
  passingScore: string;
  subjects: PublicExamSubject[];
  subjectName: string;
  step: 1 | 2 | 3;
}

const EMPTY_DRAFT: PublicExamDraft = {
  name: '',
  role: '',
  year: '',
  examBoardName: '',
  totalQuestions: '',
  examDurationMinutes: '',
  passingScore: '',
  subjects: [],
  subjectName: '',
  step: 1,
};

function readFromStorage(): PublicExamDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);

      return { ...EMPTY_DRAFT, ...parsed };
    }
  } catch {
    /* corrupted or unavailable storage */
  }

  return EMPTY_DRAFT;
}

function writeToStorage(draft: PublicExamDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* storage full or unavailable */
  }
}

function removeFromStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function usePublicExamDraft() {
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [year, setYear] = useState('');
  const [examBoardName, setExamBoardName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [examDurationMinutes, setExamDurationMinutes] = useState('');
  const [passingScore, setPassingScore] = useState('');
  const [subjects, setSubjects] = useState<PublicExamSubject[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const draft = readFromStorage();

    setName(draft.name);
    setRole(draft.role);
    setYear(draft.year);
    setExamBoardName(draft.examBoardName);
    setTotalQuestions(draft.totalQuestions ?? '');
    setExamDurationMinutes(draft.examDurationMinutes ?? '');
    setPassingScore(draft.passingScore ?? '');
    setSubjects(draft.subjects);
    setSubjectName(draft.subjectName);
    setStep(draft.step ?? 1);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeToStorage({ name, role, year, examBoardName, totalQuestions, examDurationMinutes, passingScore, subjects, subjectName, step });
  }, [hydrated, name, role, year, examBoardName, totalQuestions, examDurationMinutes, passingScore, subjects, subjectName, step]);

  const addSubject = (subject: PublicExamSubject) => {
    setSubjects((prev) => [...prev, subject]);
    setSubjectName('');
  };

  const addEmptySubject = () => {
    setSubjects((prev) => [...prev, { name: '', minQuestions: 0, maxQuestions: 0, topics: [] }]);
  };

  const updateSubject = (index: number, name: string, minQuestions: number, maxQuestions: number) => {
    setSubjects((prev) => prev.map((s, i) => (i === index ? { ...s, name, minQuestions, maxQuestions } : s)));
  };

  const removeSubject = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setName('');
    setRole('');
    setYear('');
    setExamBoardName('');
    setTotalQuestions('');
    setExamDurationMinutes('');
    setPassingScore('');
    setSubjects([]);
    setSubjectName('');
    setStep(1);
    removeFromStorage();
  };

  return {
    name,
    setName,
    role,
    setRole,
    year,
    setYear,
    examBoardName,
    setExamBoardName,
    totalQuestions,
    setTotalQuestions,
    examDurationMinutes,
    setExamDurationMinutes,
    passingScore,
    setPassingScore,
    subjects,
    subjectName,
    setSubjectName,
    step,
    setStep,
    addSubject,
    addEmptySubject,
    updateSubject,
    removeSubject,
    reset,
  };
}
