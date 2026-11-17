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

export function ScrollRestore({ getContainer, behavior = 'auto' }: ScrollRestoreProps) {
  const markerRef = useRef<HTMLSpanElement>(null);
  // Restore only on mount; later prop changes must not re-run the effect.
  const [options] = useState(() => ({ getContainer, behavior }));

  useLayoutEffect(() => {
    const container =
      options.getContainer?.() ?? findScrollableParent(markerRef.current) ?? getScrollingElement();

    if (!container) {
      return;
    }

    let attempts = 0;
    let frameId: number | undefined;

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

    restore();

    return () => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [options]);

  return <span ref={markerRef} aria-hidden='true' style={{ display: 'none' }} />;
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
  const offset = getScrollOffset(container, anchor);

  if (isDocumentScroller(container)) {
    window.scrollTo({
      top: anchor.getBoundingClientRect().top + window.scrollY - offset,
      behavior,
    });
    return;
  }

  const top =
    anchor.getBoundingClientRect().top -
    container.getBoundingClientRect().top -
    container.clientTop +
    container.scrollTop -
    offset;

  container.scrollTo({ top, behavior });
}

/**
 * Matches native fragment navigation: the target's `scroll-margin-top` and the scroll container's
 * `scroll-padding-top` keep the anchor clear of sticky headers and fixed toolbars.
 */
function getScrollOffset(container: HTMLElement, anchor: Element): number {
  const scrollContainer = isDocumentScroller(container)
    ? (document.scrollingElement ?? container)
    : container;
  const anchorMarginTop = parseScrollLength(window.getComputedStyle(anchor).scrollMarginTop);
  const containerPaddingTop = parseScrollLength(
    window.getComputedStyle(scrollContainer).scrollPaddingTop,
  );

  return anchorMarginTop + containerPaddingTop;
}

function parseScrollLength(value: string): number {
  const length = Number.parseFloat(value);
  return Number.isFinite(length) ? length : 0;
}
