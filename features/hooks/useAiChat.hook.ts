'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { saveCertification } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { AI_CHAT_LOCAL_STORAGE_KEY } from '@/config/constants';
import { ChatMessage, Certification } from '@/shared/types';

interface UseAiChatReturn {
  readonly messages: ChatMessage[];
  readonly input: string;
  readonly isStreaming: boolean;
  readonly currentStreamContent: string;
  readonly setInput: (value: string) => void;
  readonly sendMessage: () => void;
  readonly reset: () => void;
  readonly saveCertificationFromChat: (certification: Certification) => Promise<'success' | 'duplicate' | 'error'>;
}

interface ParsedCertResponse {
  context: string;
  sources: string[];
  certificationData: Certification;
}

function parseCertificationData(text: string): ParsedCertResponse | null {
  const match = /```certification-data\s*\n([\s\S]*?)```/.exec(text);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    const cert = parsed.certificationData;
    if (!cert?.label || !cert?.key || !Array.isArray(cert?.topics)) return null;
    if (!cert.topics.every((t: unknown) =>
      typeof (t as Record<string, unknown>).name === 'string' &&
      typeof (t as Record<string, unknown>).minQuestions === 'number' &&
      typeof (t as Record<string, unknown>).maxQuestions === 'number'
    )) return null;
    return {
      context: typeof parsed.context === 'string' ? parsed.context : '',
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      certificationData: cert as Certification,
    };
  } catch {
    return null;
  }
}

function loadMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(AI_CHAT_LOCAL_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as ChatMessage[];
  } catch {
    return [];
  }
}

export function useAiChat(): UseAiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const { t, language } = useTranslation();

  useEffect(() => {
    localStorage.setItem(AI_CHAT_LOCAL_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setInput('');
    setIsStreaming(false);
    setCurrentStreamContent('');
    localStorage.removeItem(AI_CHAT_LOCAL_STORAGE_KEY);
  }, []);

  const sendMessage = useCallback(async () => {
    debugger
    if (input.trim() === '' || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const messagesWithUser = [...messages, userMsg];

    setMessages(messagesWithUser);
    setInput('');
    setIsStreaming(true);
    setCurrentStreamContent('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesWithUser, language }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let streamDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done || streamDone) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.done) { streamDone = true; break; }
            if (parsed.content) {
              accumulated += parsed.content;
              setCurrentStreamContent(accumulated);
            }
          } catch { /* malformed chunk, skip */ }
        }
      }

      const parsed = parseCertificationData(accumulated);
      const assistantMsg: ChatMessage = parsed
        ? { role: 'assistant', content: parsed.context, certificationData: parsed.certificationData, sources: parsed.sources }
        : { role: 'assistant', content: accumulated };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: t('chat.errorGeneric'), isError: true },
      ]);
    } finally {
      setIsStreaming(false);
      setCurrentStreamContent('');
    }
  }, [input, isStreaming, messages, t, language]);

  const saveCertificationFromChat = async (certification: Certification): Promise<'success' | 'duplicate' | 'error'> => {
    try {
      const savedCertification = await saveCertification(certification);
      window.dispatchEvent(new CustomEvent('certification-created', { detail: savedCertification }));
      return 'success';
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.status === 409) return 'duplicate';
      return 'error';
    }
  };

  return {
    messages,
    input,
    isStreaming,
    currentStreamContent,
    setInput,
    sendMessage,
    reset,
    saveCertificationFromChat,
  };
}
