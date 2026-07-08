'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Guard against navigation while `shouldBlock` is true. Covers three exit paths:
 *
 * 1. **beforeunload** — reload, close tab, external URL. Browser shows its own prompt.
 * 2. **SPA nav via link clicks** — intercepts clicks on `<a>` elements in the
 *    capture phase (before NextLink's own handler). This works whether the
 *    Next router uses `history.pushState` internally or not.
 * 3. **`router.push` from code** — patches `history.pushState` /
 *    `replaceState` as a fallback for imperative navigation. Deferred via
 *    `queueMicrotask` so we don't run setState from inside React's
 *    insertion-effect phase.
 * 4. **Browser back / forward** — listens to `popstate`, re-pushes current URL
 *    to keep the URL bar in place, then delegates to `onBlock(proceed)`.
 *
 * The returned `bypassNext()` lets the caller navigate imperatively without
 * triggering the block (e.g. after a confirm modal that already consented). Use
 * it right before `router.push(...)`.
 */
export function useNavigationGuard(
  shouldBlock: boolean,
  onBlock: (proceed: () => void) => void
) {
  const shouldBlockRef = useRef(shouldBlock);
  const onBlockRef = useRef(onBlock);
  const bypassNextRef = useRef(false);
  const router = useRouter();

  shouldBlockRef.current = shouldBlock;
  onBlockRef.current = onBlock;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    // Defer the block callback so setState in the handler doesn't run inside
    // React's insertion-effect phase (NextLink triggers pushState from there).
    function deferBlock(proceed: () => void) {
      queueMicrotask(() => onBlockRef.current(proceed));
    }

    function shouldSkip(): boolean {
      if (bypassNextRef.current) {
        bypassNextRef.current = false;

        return true;
      }

      return !shouldBlockRef.current;
    }

    // 1. Intercept clicks on <a href="..."> before NextLink handles them.
    //    Capture phase runs before bubble, so we get first dibs.
    const handleClick = (e: MouseEvent) => {
      if (!shouldBlockRef.current) return;
      // Ignore modified clicks (ctrl/cmd/shift, middle button, right button)
      // — those go to a new tab / context menu, not to the SPA router.
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');

      if (!href || href.startsWith('#') || anchor.target === '_blank') return;

      // Same-origin external link? Let it be — pushState patch will catch
      // NextLink's programmatic call. But we handle common navbar case here.
      if (anchor.origin !== window.location.origin) return;
      // Same URL — no navigation to intercept.
      if (anchor.href === window.location.href) return;

      e.preventDefault();
      e.stopPropagation();
      const targetHref = anchor.href;

      deferBlock(() => {
        bypassNextRef.current = true;
        router.push(targetHref);
      });
    };

    document.addEventListener('click', handleClick, true);

    // 2. Fallback for imperative router.push calls (from code, not clicks).
    const patchedPushState: typeof window.history.pushState = function (data, unused, url) {
      if (url == null || shouldSkip()) {
        originalPushState(data, unused, url);

        return;
      }
      deferBlock(() => {
        bypassNextRef.current = true;
        window.history.pushState(data, unused, url);
      });
    };

    const patchedReplaceState: typeof window.history.replaceState = function (data, unused, url) {
      if (url == null || shouldSkip()) {
        originalReplaceState(data, unused, url);

        return;
      }
      deferBlock(() => {
        bypassNextRef.current = true;
        window.history.replaceState(data, unused, url);
      });
    };

    window.history.pushState = patchedPushState;
    window.history.replaceState = patchedReplaceState;

    // 3. beforeunload (reload, close tab, external URL).
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldBlockRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // 4. Browser back/forward.
    const handlePopState = () => {
      if (!shouldBlockRef.current) return;
      // Undo the browser-initiated back: re-push the current URL as a fresh entry.
      // originalPushState avoids re-entering the patched version.
      originalPushState(null, '', window.location.href);
      deferBlock(() => {
        window.removeEventListener('popstate', handlePopState);
        window.history.back();
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  return {
    bypassNext: () => {
      bypassNextRef.current = true;
    },
  };
}
