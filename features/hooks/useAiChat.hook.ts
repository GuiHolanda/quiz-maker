'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { saveCertification, extractEdital } from '@/features/connectors';
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
  readonly handleEditalUpload: (file: File) => void;
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
  const pendingEditalRef = useRef<File | null>(null);
  const { t, language } = useTranslation();

  useEffect(() => {
    localStorage.setItem(AI_CHAT_LOCAL_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    pendingEditalRef.current = null;
    setMessages([]);
    setInput('');
    setIsStreaming(false);
    setCurrentStreamContent('');
    localStorage.removeItem(AI_CHAT_LOCAL_STORAGE_KEY);
  }, []);

  const sendMessage = useCallback(async () => {
    if (input.trim() === '' || isStreaming) return;

    // If there's a pending edital, the user's message is the cargo — extract now
    if (pendingEditalRef.current) {
      const file = pendingEditalRef.current;
      const role = input.trim();
      pendingEditalRef.current = null;

      const userMsg: ChatMessage = { role: 'user', content: role };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsStreaming(true);

      const loadingMsg: ChatMessage = { role: 'assistant', content: t('chat.analyzingEdital') };
      setMessages(prev => [...prev, loadingMsg]);

      try {
        const publicExam = await extractEdital(file, role);
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: '', examDraft: publicExam },
        ]);
      } catch (err: any) {
        const errorContent = err?.response?.status === 413
          ? t('chat.errorFileTooLarge')
          : err?.response?.status === 400
            ? t('chat.errorInvalidFile')
            : t('chat.errorGeneric');
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: errorContent, isError: true },
        ]);
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const messagesWithUser = [...messages, userMsg];

    setMessages(messagesWithUser);
    setInput('');
    setIsStreaming(true);
    setCurrentStreamContent('');

    abortControllerRef.current = new AbortController();

    let accumulated = '';

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

      let errorKey = 'chat.errorGeneric';

      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        errorKey = 'chat.errorNetwork';
      } else if (err instanceof Error) {
        if (err.message.includes('HTTP 401')) {
          errorKey = 'chat.errorSession';
        } else if (/HTTP 5\d\d/.test(err.message)) {
          errorKey = 'chat.errorServer';
        } else if (err.message === 'No response body' || accumulated.length > 0) {
          errorKey = 'chat.errorStreamInterrupted';
        }
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: t(errorKey), isError: true },
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

  const handleEditalUpload = useCallback((file: File) => {
    if (isStreaming) return;
    pendingEditalRef.current = file;
    const askMsg: ChatMessage = {
      role: 'assistant',
      content: t('chat.askRole'),
    };
    setMessages(prev => [...prev, askMsg]);
  }, [isStreaming, t]);

  return {
    messages,
    input,
    isStreaming,
    currentStreamContent,
    setInput,
    sendMessage,
    reset,
    saveCertificationFromChat,
    handleEditalUpload,
  };
}
