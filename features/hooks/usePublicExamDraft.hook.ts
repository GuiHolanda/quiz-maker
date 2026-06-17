import { useEffect, useState } from 'react';

import { PublicExamSubject } from '@/shared/types';

const STORAGE_KEY = 'NEW_PUBLIC_EXAM_DRAFT';

interface PublicExamDraft {
  name: string;
  role: string;
  year: string;
  examBoardName: string;
  subjects: PublicExamSubject[];
  subjectName: string;
}

const EMPTY_DRAFT: PublicExamDraft = {
  name: '',
  role: '',
  year: '',
  examBoardName: '',
  subjects: [],
  subjectName: '',
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
  const [subjects, setSubjects] = useState<PublicExamSubject[]>([]);
  const [subjectName, setSubjectName] = useState('');

  useEffect(() => {
    const draft = readFromStorage();

    setName(draft.name);
    setRole(draft.role);
    setYear(draft.year);
    setExamBoardName(draft.examBoardName);
    setSubjects(draft.subjects);
    setSubjectName(draft.subjectName);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeToStorage({ name, role, year, examBoardName, subjects, subjectName });
  }, [hydrated, name, role, year, examBoardName, subjects, subjectName]);

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
    setSubjects([]);
    setSubjectName('');
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
    subjects,
    subjectName,
    setSubjectName,
    addSubject,
    addEmptySubject,
    updateSubject,
    removeSubject,
    reset,
  };
}
