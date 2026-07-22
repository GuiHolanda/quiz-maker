'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

import { extractEdital } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import {
  AI_CHAT_FOLLOWUP_TIMESTAMP_KEY,
  AI_CHAT_INACTIVITY_TIMEOUT_MS,
  AI_CHAT_LOCAL_STORAGE_KEY,
} from '@/config/constants';
import { ChatMessage, Certification } from '@/shared/types';

interface UseAiChatReturn {
  readonly messages: ChatMessage[];
  readonly input: string;
  readonly isStreaming: boolean;
  readonly currentStreamContent: string;
  readonly pendingFile: File | null;
  readonly setInput: (value: string) => void;
  readonly sendMessage: () => void;
  readonly reset: () => void;
  readonly handleEditalUpload: (file: File) => void;
  readonly cancelPendingFile: () => void;
  readonly injectAssistantMessage: (content: string) => void;
  readonly markFollowUpInactivity: () => void;
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
    if (
      !cert.topics.every(
        (t: unknown) =>
          typeof (t as Record<string, unknown>).name === 'string' &&
          typeof (t as Record<string, unknown>).minQuestions === 'number' &&
          typeof (t as Record<string, unknown>).maxQuestions === 'number'
      )
    )
      return null;

    return {
      context: typeof parsed.context === 'string' ? parsed.context : '',
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      certificationData: {
        ...cert,
        totalQuestions: typeof cert.totalQuestions === 'number' ? cert.totalQuestions : 0,
        examDurationMinutes: typeof cert.examDurationMinutes === 'number' ? cert.examDurationMinutes : undefined,
        passingScore: typeof cert.passingScore === 'number' ? cert.passingScore : undefined,
      } as Certification,
    };
  } catch {
    return null;
  }
}

const LEGACY_AI_CHAT_KEY = 'AI_CHAT_MESSAGES';
const LEGACY_AI_CHAT_FOLLOWUP_KEY = 'AI_CHAT_FOLLOWUP_TS';

function loadMessages(userId: string): ChatMessage[] {
  try {
    // One-time migration: copy messages stored under the pre-userId-scoping key
    // and delete it so the next load uses the scoped key exclusively.
    const legacy = localStorage.getItem(LEGACY_AI_CHAT_KEY);

    if (legacy) {
      localStorage.setItem(AI_CHAT_LOCAL_STORAGE_KEY(userId), legacy);
      localStorage.removeItem(LEGACY_AI_CHAT_KEY);
      localStorage.removeItem(LEGACY_AI_CHAT_FOLLOWUP_KEY);
    }

    const stored = localStorage.getItem(AI_CHAT_LOCAL_STORAGE_KEY(userId));

    if (!stored) return [];

    return JSON.parse(stored) as ChatMessage[];
  } catch {
    return [];
  }
}

export function useAiChat(userId: string): UseAiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(userId));
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingEditalRef = useRef<File | null>(null);
  const followUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t, language } = useTranslation();

  // Persist messages to user-scoped localStorage key.
  // Guard: skip the write on the same render tick where userId just changed —
  // prevUserIdRef is updated synchronously inside the userId-change effect,
  // so if they differ here we know we are in the transition render and the
  // in-memory messages still belong to the previous user.
  useEffect(() => {
    if (prevUserIdRef.current !== userId) return;
    localStorage.setItem(AI_CHAT_LOCAL_STORAGE_KEY(userId), JSON.stringify(messages));
  }, [messages, userId]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    pendingEditalRef.current = null;
    setPendingFile(null);
    setMessages([]);
    setInput('');
    setIsStreaming(false);
    setCurrentStreamContent('');
    localStorage.removeItem(AI_CHAT_LOCAL_STORAGE_KEY(userId));
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
    localStorage.removeItem(AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(userId));
  }, [userId]);

  // When userId changes (user logged out and a different user logged in),
  // reset all state and load the new user's messages from their scoped key.
  const prevUserIdRef = useRef(userId);

  useEffect(() => {
    if (prevUserIdRef.current === userId) return;
    const outgoingUserId = prevUserIdRef.current;

    prevUserIdRef.current = userId;

    // Remove the outgoing user's follow-up timer key so it doesn't fire
    // unexpectedly if they log back in on this device.
    localStorage.removeItem(AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(outgoingUserId));

    abortControllerRef.current?.abort();
    pendingEditalRef.current = null;
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
    setPendingFile(null);
    setInput('');
    setIsStreaming(false);
    setCurrentStreamContent('');
    setMessages(loadMessages(userId));
  }, [userId]);

  const scheduleFollowUpReset = useCallback(
    (expiresAt: number) => {
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
      const remaining = Math.max(0, expiresAt - Date.now());

      followUpTimerRef.current = setTimeout(() => reset(), remaining);
    },
    [reset]
  );

  const clearFollowUpInactivity = useCallback(() => {
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
    localStorage.removeItem(AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(userId));
  }, [userId]);

  const markFollowUpInactivity = useCallback(() => {
    const expiresAt = Date.now() + AI_CHAT_INACTIVITY_TIMEOUT_MS;

    localStorage.setItem(AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(userId), String(expiresAt));
    scheduleFollowUpReset(expiresAt);
  }, [scheduleFollowUpReset, userId]);

  useEffect(() => {
    const raw = localStorage.getItem(AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(userId));

    if (!raw) return;
    const expiresAt = parseInt(raw, 10);

    if (!Number.isFinite(expiresAt)) {
      localStorage.removeItem(AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(userId));

      return;
    }
    scheduleFollowUpReset(expiresAt);

    return () => {
      if (followUpTimerRef.current) {
        clearTimeout(followUpTimerRef.current);
        followUpTimerRef.current = null;
      }
    };
  }, [scheduleFollowUpReset, userId]);

  const sendMessage = useCallback(async () => {
    if ((input.trim() === '' && !pendingEditalRef.current) || isStreaming) return;

    clearFollowUpInactivity();

    // If there's a pending edital, extract now — role is what the user typed,
    // or the last user message in the conversation if input is empty
    if (pendingEditalRef.current) {
      const file = pendingEditalRef.current;
      const typedRole = input.trim();
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      const role = typedRole || lastUserMessage?.content || '';

      pendingEditalRef.current = null;
      setPendingFile(null);

      const userMsg: ChatMessage = {
        role: 'user',
        content: role || '📎',
        attachmentName: file.name,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsStreaming(true);

      const loadingMsg: ChatMessage = { role: 'assistant', content: t('chat.analyzingEdital') };

      setMessages((prev) => [...prev, loadingMsg]);

      try {
        const publicExam = await extractEdital(file, role || undefined);

        setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: '', examDraft: publicExam }]);
      } catch (err: any) {
        const errorContent =
          err?.response?.status === 413
            ? t('chat.errorFileTooLarge')
            : err?.response?.status === 400
              ? t('chat.errorInvalidFile')
              : t('chat.errorGeneric');

        setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: errorContent, isError: true }]);
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
      const response = await fetch('/api/ai/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesWithUser.filter((m) => m.content.trim() !== ''),
          language,
        }),
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

            if (parsed.done) {
              streamDone = true;
              break;
            }
            if (parsed.content) {
              accumulated += parsed.content;
              setCurrentStreamContent(accumulated);
            }
          } catch {
            /* malformed chunk, skip */
          }
        }
      }

      const cleanContent = accumulated.replace('[ENCERRAR_SESSAO]', '').trim();
      const parsed = parseCertificationData(cleanContent);
      const assistantMsg: ChatMessage = parsed
        ? {
            role: 'assistant',
            content: parsed.context,
            certificationData: parsed.certificationData,
            sources: parsed.sources,
          }
        : { role: 'assistant', content: cleanContent };

      setMessages((prev) => [...prev, assistantMsg]);

      if (accumulated.includes('[ENCERRAR_SESSAO]')) {
        // Store in followUpTimerRef so userId-change cleanup can cancel it
        // if the user switches accounts within the 1500ms window.
        if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
        followUpTimerRef.current = setTimeout(() => reset(), 1500);
      }
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

      setMessages((prev) => [...prev, { role: 'assistant', content: t(errorKey), isError: true }]);
    } finally {
      setIsStreaming(false);
      setCurrentStreamContent('');
    }
  }, [input, isStreaming, messages, t, language, clearFollowUpInactivity, reset]);

  const handleEditalUpload = useCallback(
    (file: File) => {
      if (isStreaming) return;
      pendingEditalRef.current = file;
      setPendingFile(file);
    },
    [isStreaming]
  );

  const cancelPendingFile = useCallback(() => {
    pendingEditalRef.current = null;
    setPendingFile(null);
  }, []);

  const injectAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', content }]);
  }, []);

  return {
    messages,
    input,
    isStreaming,
    currentStreamContent,
    pendingFile,
    setInput,
    sendMessage,
    reset,
    handleEditalUpload,
    cancelPendingFile,
    injectAssistantMessage,
    markFollowUpInactivity,
  };
}
