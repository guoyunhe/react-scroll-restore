import { useLayoutEffect, useRef, useState } from 'react';

export interface ScrollRestoreProps {
  /**
   * Returns the element to scroll. Defaults to the first scrollable ancestor of the component, or
   * the document scrolling element if there is none.
   */
  getContainer?: () => HTMLElement | null;
  /**
   * Scroll behavior passed to `scrollTo`.
   *
   * @default 'auto'
   */
  behavior?: ScrollBehavior;
}

const MAX_ANCHOR_ATTEMPTS = 30;
const NAVIGATION_EVENT = 'react-scroll-restore:navigation';

let historyPatched = false;

export function ScrollRestore({ getContainer, behavior = 'auto' }: ScrollRestoreProps) {
  const markerRef = useRef<HTMLSpanElement>(null);
  // Restore only on mount; later prop changes must not re-run the effect.
  const [options] = useState(() => ({ getContainer, behavior }));

  useLayoutEffect(() => {
    patchHistory();

    const container =
      options.getContainer?.() ?? findScrollableParent(markerRef.current) ?? getScrollingElement();

    if (!container) {
      return;
    }

    let attempts = 0;
    let frameId: number | undefined;

    const cancelRetry = () => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
        frameId = undefined;
      }
    };

    const restore = () => {
      const hash = window.location.hash;
      const anchor = hash.length > 1 ? findAnchor(hash) : null;

      if (!anchor) {
        if (attempts === 0) {
          scrollToTop(container, options.behavior);
        }
        // The target may be rendered asynchronously (e.g. after data loading).
        if (hash.length > 1 && ++attempts < MAX_ANCHOR_ATTEMPTS) {
          frameId = requestAnimationFrame(restore);
        }
        return;
      }

      scrollToAnchor(container, anchor, options.behavior);
    };

    const handleNavigation = () => {
      cancelRetry();
      attempts = 0;
      restore();
    };

    restore();

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener(NAVIGATION_EVENT, handleNavigation);

    return () => {
      cancelRetry();
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener(NAVIGATION_EVENT, handleNavigation);
    };
  }, [options]);

  return <span ref={markerRef} aria-hidden='true' style={{ display: 'none' }} />;
}

/**
 * Emits `NAVIGATION_EVENT` for `pushState`/`replaceState` calls so that router-agnostic navigation
 * can be detected.
 */
function patchHistory() {
  if (historyPatched) {
    return;
  }
  historyPatched = true;

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = (...args) => {
    originalPushState(...args);
    window.dispatchEvent(new Event(NAVIGATION_EVENT));
  };

  window.history.replaceState = (...args) => {
    originalReplaceState(...args);
    window.dispatchEvent(new Event(NAVIGATION_EVENT));
  };
}

function findAnchor(hash: string): Element | null {
  let id = hash.slice(1);

  try {
    id = decodeURIComponent(id);
  } catch {
    // Keep the raw hash when it is not valid percent-encoding.
  }

  return id ? document.getElementById(id) : null;
}

function findScrollableParent(start: Element | null): HTMLElement | null {
  let element = start?.parentElement ?? null;

  while (element) {
    const { overflowY } = window.getComputedStyle(element);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return element;
    }
    element = element.parentElement;
  }

  return null;
}

function getScrollingElement(): HTMLElement | null {
  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
}

function isDocumentScroller(container: HTMLElement): boolean {
  return (
    container === document.scrollingElement ||
    container === document.documentElement ||
    container === document.body
  );
}

function scrollToTop(container: HTMLElement, behavior: ScrollBehavior) {
  if (isDocumentScroller(container)) {
    window.scrollTo({ top: 0, behavior });
  } else {
    container.scrollTo({ top: 0, behavior });
  }
}

function scrollToAnchor(container: HTMLElement, anchor: Element, behavior: ScrollBehavior) {
  if (isDocumentScroller(container)) {
    window.scrollTo({ top: anchor.getBoundingClientRect().top + window.scrollY, behavior });
    return;
  }

  const top =
    anchor.getBoundingClientRect().top -
    container.getBoundingClientRect().top -
    container.clientTop +
    container.scrollTop;

  container.scrollTo({ top, behavior });
}
