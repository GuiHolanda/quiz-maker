import { CertificationTopic } from '@/shared/types';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'NEW_CERTIFICATION_DRAFT';

interface CertificationDraft {
  title: string;
  code: string;
  topics: CertificationTopic[];
  topicName: string;
}

const EMPTY_DRAFT: CertificationDraft = { title: '', code: '', topics: [], topicName: '' };

function readFromStorage(): CertificationDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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
  const [title, setTitle] = useState(() => readFromStorage().title);
  const [code, setCode] = useState(() => readFromStorage().code);
  const [topics, setTopics] = useState<CertificationTopic[]>(() => readFromStorage().topics);
  const [topicName, setTopicName] = useState(() => readFromStorage().topicName);

  useEffect(() => {
    writeToStorage({ title, code, topics, topicName });
  }, [title, code, topics, topicName]);

  const addTopic = (topic: CertificationTopic) => {
    setTopics((prev) => [...prev, topic]);
    setTopicName('');
  };

  const hasTopic = (name: string) => topics.some((t) => t.name === name);

  const reset = () => {
    setTitle('');
    setCode('');
    setTopics([]);
    setTopicName('');
    removeFromStorage();
  };

  return {
    title, setTitle,
    code, setCode,
    topics,
    topicName, setTopicName,
    addTopic,
    hasTopic,
    reset,
  };
}
