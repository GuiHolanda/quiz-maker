'use client';
import type { ChatMessage, Exam, ExamType, Language } from '@/shared/types';

import { useCallback, useRef, useState } from 'react';

import { extractEdital } from '@/features/connectors';
import { parseCertificationData } from '@/lib/parse-certification-data';
import { parseIdentifyResponse, type CertificationMatch } from '@/lib/parse-identify-response';
import { useLimitModal } from '@/features/hooks/useLimitModal.hook';
import { DEFAULT_QUESTION_FORMAT } from '@/config/question-formats';
import { AUTO_CONFIG_URL } from '@/config/constants';

export type ExamSeedState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'identifying' }
  | { readonly kind: 'disambiguating'; readonly examName: string; readonly matches: CertificationMatch[] }
  | { readonly kind: 'clarifying'; readonly examName: string; readonly message: string }
  // The certification is confirmed — the editor (Tela 2) mounts now, showing a skeleton
  // where the distribution table will land, rather than holding the user on Tela 1 through
  // a second network round-trip. `provider` seeds the editor's header immediately.
  | { readonly kind: 'loading-blueprint'; readonly examName: string; readonly provider: string }
  | { readonly kind: 'extracting-edital' }
  | { readonly kind: 'ready'; readonly draft: Exam; readonly context: string; readonly sources: string[] }
  // The model failed or returned something unparseable — open the editor blank rather than
  // dead-end the user; `seedName` pre-fills the name field so nothing they typed is lost.
  // `messageKey` is one of ours (an i18n key), unlike `clarifying.message` above which is
  // the model's own prose and is rendered verbatim, not translated.
  | { readonly kind: 'error'; readonly messageKey: string; readonly seedName: string };

// Exported so page.tsx can build the same blank shape for the error-fallback path
// (§2.4 — a failed AI seed opens the editor blank rather than dead-ending the user).
export function emptyExamDraft(type: ExamType): Exam {
  return {
    type,
    name: '',
    role: null,
    year: null,
    key: null,
    totalQuestions: 0,
    examDurationMinutes: null,
    passingScore: null,
    questionFormat: DEFAULT_QUESTION_FORMAT,
    provider: null,
    examBoard: null,
    sections: [],
  };
}

// Minimal SSE reader for a single headless turn against /api/exam/auto-config — a separate,
// pro+-gated and metered endpoint from the pro_ai-only conversational drawer (/api/ai/ai-chat),
// even though both stream from the same AiChatService. This flow has no live-typing bubble to
// update, so unlike useAiChat.hook.ts it only needs the final accumulated text once the stream ends.
async function streamAiChatOnce(messages: ChatMessage[], language: Language, signal: AbortSignal): Promise<string> {
  const response = await fetch(`/api${AUTO_CONFIG_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages.map((m) => ({ role: m.role, content: m.content })), language }),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    // Keep status + payload on the error: a 403 here is a quota/plan wall the caller must
    // show as the limit modal, and a bare Error would collapse it into a generic failure.
    throw Object.assign(new Error(body.message || `HTTP ${response.status}`), {
      status: response.status,
      response: { status: response.status, data: body },
    });
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
      try {
        const parsed = JSON.parse(line.slice(6));

        if (parsed.done) {
          streamDone = true;
          break;
        }
        if (parsed.content) accumulated += parsed.content;
      } catch {
        /* malformed chunk, skip */
      }
    }
  }

  return accumulated.replace('[ENCERRAR_SESSAO]', '').trim();
}

interface UseExamSeedReturn {
  readonly state: ExamSeedState;
  readonly identifyByName: (examName: string) => Promise<void>;
  readonly confirmMatch: (examName: string, match: CertificationMatch) => Promise<void>;
  readonly uploadEdital: (file: File, role: string | undefined) => Promise<void>;
  readonly startBlank: (type: ExamType) => void;
  readonly reset: () => void;
}

export function useExamSeed(language: Language): UseExamSeedReturn {
  const [state, setState] = useState<ExamSeedState>({ kind: 'idle' });
  const abortRef = useRef<AbortController | null>(null);
  const { showLimitIfBlocked } = useLimitModal();

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ kind: 'idle' });
  }, []);

  const startBlank = useCallback((type: ExamType) => {
    setState({ kind: 'ready', draft: emptyExamDraft(type), context: '', sources: [] });
  }, []);

  // Second leg of the certification seed: replay the identify turn plus a confirming user
  // turn so AiChatService.selectPrompt sees an assistant message already in history and
  // switches to AI_CHAT_TOPICS_PROMPT, which — for a confirmed certification — answers with
  // the certification-data JSON block directly (no further disambiguation).
  const fetchBlueprint = useCallback(
    async (examName: string, provider: string, identifyResponseText: string, confirmationText: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();

      abortRef.current = controller;
      setState({ kind: 'loading-blueprint', examName, provider });

      try {
        const conversation: ChatMessage[] = [
          { role: 'user', content: examName },
          { role: 'assistant', content: identifyResponseText },
          { role: 'user', content: confirmationText },
        ];
        const text = await streamAiChatOnce(conversation, language, controller.signal);
        const parsed = parseCertificationData(text);

        if (!parsed) {
          setState({
            kind: 'error',
            messageKey: 'error.aiSeedNoBlueprint',
            seedName: examName,
          });
          return;
        }
        setState({ kind: 'ready', draft: parsed.examDraft, context: parsed.context, sources: parsed.sources });
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        // A quota/plan wall isn't a seed failure: opening a blank editor would only lead
        // to a second block at save. Return to the picker and let the modal explain.
        if (showLimitIfBlocked(err)) {
          setState({ kind: 'idle' });

          return;
        }
        setState({ kind: 'error', messageKey: 'error.aiSeedNoBlueprint', seedName: examName });
      }
    },
    [language, showLimitIfBlocked]
  );

  const identifyByName = useCallback(
    async (examName: string) => {
      const trimmed = examName.trim();

      if (!trimmed) return;

      abortRef.current?.abort();
      const controller = new AbortController();

      abortRef.current = controller;
      setState({ kind: 'identifying' });

      try {
        const text = await streamAiChatOnce([{ role: 'user', content: trimmed }], language, controller.signal);
        const parsed = parseIdentifyResponse(text);

        if (parsed.kind === 'multiple') {
          setState({ kind: 'disambiguating', examName: trimmed, matches: parsed.matches });
          return;
        }
        if (parsed.kind === 'none') {
          setState({ kind: 'clarifying', examName: trimmed, message: parsed.message });
          return;
        }

        const confirmation =
          language === 'pt' ? `Sim, é "${parsed.match.label}".` : `Yes, that's "${parsed.match.label}".`;

        await fetchBlueprint(trimmed, parsed.match.provider, text, confirmation);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        if (showLimitIfBlocked(err)) {
          setState({ kind: 'idle' });

          return;
        }
        setState({ kind: 'error', messageKey: 'error.aiSeedNoIdentify', seedName: trimmed });
      }
    },
    [language, fetchBlueprint, showLimitIfBlocked]
  );

  const confirmMatch = useCallback(
    async (examName: string, match: CertificationMatch) => {
      const identifyResponseText =
        language === 'pt'
          ? `**${match.label}** — ${match.provider}. É essa que você quer criar?`
          : `**${match.label}** — ${match.provider}. Is this the one you want to create?`;
      const confirmation = language === 'pt' ? `Sim, é "${match.label}".` : `Yes, that's "${match.label}".`;

      await fetchBlueprint(examName, match.provider, identifyResponseText, confirmation);
    },
    [language, fetchBlueprint]
  );

  const uploadEdital = useCallback(
    async (file: File, role: string | undefined) => {
      setState({ kind: 'extracting-edital' });
      try {
        const exam = await extractEdital(file, role);

        setState({ kind: 'ready', draft: exam, context: '', sources: [] });
      } catch (err: unknown) {
        if (showLimitIfBlocked(err)) {
          setState({ kind: 'idle' });

          return;
        }
        setState({ kind: 'error', messageKey: 'error.aiSeedEditalFailed', seedName: '' });
      }
    },
    [showLimitIfBlocked]
  );

  return { state, identifyByName, confirmMatch, uploadEdital, startBlank, reset };
}
