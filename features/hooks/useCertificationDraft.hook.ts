import { useEffect, useState } from 'react';

import { CertificationTopic } from '@/shared/types';

const STORAGE_KEY = 'NEW_CERTIFICATION_DRAFT';

interface CertificationDraft {
  title: string;
  code: string;
  provider: string;
  totalQuestions: string;
  examDurationMinutes: string;
  passingScore: string;
  topics: CertificationTopic[];
  topicName: string;
  step: 1 | 2 | 3;
}

const EMPTY_DRAFT: CertificationDraft = {
  title: '',
  code: '',
  provider: '',
  totalQuestions: '',
  examDurationMinutes: '',
  passingScore: '',
  topics: [],
  topicName: '',
  step: 1,
};

function readFromStorage(): CertificationDraft {
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

function writeToStorage(draft: CertificationDraft) {
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

export function useCertificationDraft() {
  const [hydrated, setHydrated] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [provider, setProvider] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [examDurationMinutes, setExamDurationMinutes] = useState('');
  const [passingScore, setPassingScore] = useState('');
  const [topics, setTopics] = useState<CertificationTopic[]>([]);
  const [topicName, setTopicName] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const draft = readFromStorage();

    setTitle(draft.title);
    setCode(draft.code);
    setProvider(draft.provider);
    setTotalQuestions(draft.totalQuestions ?? '');
    setExamDurationMinutes(draft.examDurationMinutes ?? '');
    setPassingScore(draft.passingScore ?? '');
    setTopics(draft.topics);
    setTopicName(draft.topicName);
    setStep(draft.step ?? 1);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeToStorage({ title, code, provider, totalQuestions, examDurationMinutes, passingScore, topics, topicName, step });
  }, [hydrated, title, code, provider, totalQuestions, examDurationMinutes, passingScore, topics, topicName, step]);

  const addTopic = (topic: CertificationTopic) => {
    setTopics((prev) => [...prev, topic]);
    setTopicName('');
  };

  const addEmptyTopic = () => {
    setTopics((prev) => [...prev, { name: '', minQuestions: 0, maxQuestions: 0 }]);
  };

  const updateTopic = (index: number, name: string, minWeightage: number, maxWeightage: number) => {
    setTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, name, minQuestions: minWeightage, maxQuestions: maxWeightage } : t))
    );
  };

  const removeTopic = (index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  };

  const hasTopic = (name: string) => topics.some((t) => t.name === name);

  const reset = () => {
    setTitle('');
    setCode('');
    setProvider('');
    setTotalQuestions('');
    setExamDurationMinutes('');
    setPassingScore('');
    setTopics([]);
    setTopicName('');
    setStep(1);
    removeFromStorage();
  };

  return {
    title,
    setTitle,
    code,
    setCode,
    provider,
    setProvider,
    totalQuestions,
    setTotalQuestions,
    examDurationMinutes,
    setExamDurationMinutes,
    passingScore,
    setPassingScore,
    topics,
    topicName,
    setTopicName,
    step,
    setStep,
    addTopic,
    addEmptyTopic,
    updateTopic,
    removeTopic,
    hasTopic,
    reset,
  };
}
