'use client';
import { useState } from 'react';
import { saveCertification } from '@/features/connectors';
import { ChatMessage, Certification } from '@/types';

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

export function useAiChat(): UseAiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState('');

  const sendMessage = async () => {
    if (input.trim() === '' || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const messagesWithUser = [...messages, userMsg];

    setMessages(messagesWithUser);
    setInput('');
    setIsStreaming(true);
    setCurrentStreamContent('');

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesWithUser }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
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

      let assistantMsg: ChatMessage;
      try {
        const certMatch = accumulated.match(/```certification-data\s*\n([\s\S]*?)```/);
        if (certMatch) {
          const parsedCert = JSON.parse(certMatch[1]);
          if (parsedCert.label && parsedCert.key && parsedCert.topics) {
            assistantMsg = { role: 'assistant', content: accumulated, certificationData: parsedCert };
          } else {
            assistantMsg = { role: 'assistant', content: accumulated };
          }
        } else {
          assistantMsg = { role: 'assistant', content: accumulated };
        }
      } catch {
        assistantMsg = { role: 'assistant', content: accumulated };
      }

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.', isError: true },
      ]);
    } finally {
      setIsStreaming(false);
      setCurrentStreamContent('');
    }
  };

  const reset = () => {
    setMessages([]);
    setInput('');
    setIsStreaming(false);
    setCurrentStreamContent('');
  };

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
