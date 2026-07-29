import type { Page } from '@playwright/test';

export async function injectFakeEventSource(
  page: Page,
  opts: { topicName: string; savedCount?: number } = { topicName: 'E2E Topic' },
): Promise<void> {
  const savedCount = opts.savedCount ?? 3;
  await page.addInitScript(
    ({ topicName, savedCount: count }) => {
      class FakeEventSource {
        url: string;
        onmessage: ((ev: MessageEvent) => void) | null = null;
        onerror: ((ev: Event) => void) | null = null;
        private listeners: Record<string, ((ev: MessageEvent) => void)[]> = {};

        constructor(url: string) {
          this.url = url;
          setTimeout(() => this.fire(), 100);
        }

        addEventListener(type: string, cb: (ev: MessageEvent) => void) {
          (this.listeners[type] ||= []).push(cb);
        }

        removeEventListener(type: string, cb: (ev: MessageEvent) => void) {
          const handlers = this.listeners[type];
          if (!handlers) return;
          this.listeners[type] = handlers.filter((h) => h !== cb);
        }

        close() {}

        private fire() {
          // Drive the UI into `awaiting_review` state.
          // The provider listens via es.addEventListener('awaiting_review', ...) and expects:
          //   { doneTopics, totalTopics, queuedTopics?, topics? }
          const topic = {
            id: 'fake-topic-1',
            topicName,
            questionCount: count,
            status: 'done' as const,
            savedCount: count,
            errorMessage: null,
            errorType: null,
          };
          const payload = {
            doneTopics: 1,
            totalTopics: 1,
            queuedTopics: 0,
            topics: [topic],
          };
          const ev = new MessageEvent('awaiting_review', { data: JSON.stringify(payload) });
          (this.listeners['awaiting_review'] ?? []).forEach((cb) => cb(ev));
        }
      }

      // @ts-expect-error override global
      window.EventSource = FakeEventSource;
    },
    { topicName: opts.topicName, savedCount },
  );
}

export async function injectNeverDoneEventSource(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class NeverDoneEventSource {
      url: string;
      onmessage: ((ev: MessageEvent) => void) | null = null;
      onerror: ((ev: Event) => void) | null = null;

      constructor(url: string) {
        this.url = url;
      }

      addEventListener() {}
      removeEventListener() {}
      close() {}
    }

    // @ts-expect-error override global
    window.EventSource = NeverDoneEventSource;
  });
}
