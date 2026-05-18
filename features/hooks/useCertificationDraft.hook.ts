import { CertificationTopic } from '@/shared/types';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'NEW_CERTIFICATION_DRAFT';

interface CertificationDraft {
  title: string;
  code: string;
  provider: string;
  topics: CertificationTopic[];
  topicName: string;
}

const EMPTY_DRAFT: CertificationDraft = { title: '', code: '', provider: '', topics: [], topicName: '' };

function readFromStorage(): CertificationDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...EMPTY_DRAFT, ...parsed };
    }
  } catch { /* corrupted or unavailable storage */ }
  return EMPTY_DRAFT;
}

function writeToStorage(draft: CertificationDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch { /* storage full or unavailable */ }
}

function removeFromStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export function useCertificationDraft() {
  const [hydrated, setHydrated] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [provider, setProvider] = useState('');
  const [topics, setTopics] = useState<CertificationTopic[]>([]);
  const [topicName, setTopicName] = useState('');

  useEffect(() => {
    const draft = readFromStorage();
    setTitle(draft.title);
    setCode(draft.code);
    setProvider(draft.provider);
    setTopics(draft.topics);
    setTopicName(draft.topicName);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeToStorage({ title, code, provider, topics, topicName });
  }, [hydrated, title, code, provider, topics, topicName]);

  const addTopic = (topic: CertificationTopic) => {
    setTopics((prev) => [...prev, topic]);
    setTopicName('');
  };

  const addEmptyTopic = () => {
    setTopics((prev) => [...prev, { name: '', minQuestions: 0, maxQuestions: 0 }]);
  };

  const updateTopic = (index: number, name: string, minWeightage: number, maxWeightage: number) => {
    setTopics((prev) => prev.map((t, i) => i === index ? { ...t, name, minQuestions: minWeightage, maxQuestions: maxWeightage } : t));
  };

  const removeTopic = (index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  };

  const hasTopic = (name: string) => topics.some((t) => t.name === name);

  const reset = () => {
    setTitle('');
    setCode('');
    setProvider('');
    setTopics([]);
    setTopicName('');
    removeFromStorage();
  };

  return {
    title, setTitle,
    code, setCode,
    provider, setProvider,
    topics,
    topicName, setTopicName,
    addTopic,
    addEmptyTopic,
    updateTopic,
    removeTopic,
    hasTopic,
    reset,
  };
}
