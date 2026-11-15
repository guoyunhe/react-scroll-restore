import { useEffect, useLayoutEffect, useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ScrollRestore, type ScrollRestoreProps } from '../src';

afterEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
  document.querySelectorAll('[data-test-external]').forEach((node) => node.remove());
});

function SeedScroll({ containerId, top }: { containerId: string; top: number }) {
  useLayoutEffect(() => {
    const container = document.getElementById(containerId);
    if (container) {
      container.scrollTop = top;
    }
  }, [containerId, top]);

  return null;
}

function DelayedAnchor({ id, delay, top }: { id: string; delay: number; top: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return visible ? <div id={id} style={{ position: 'absolute', top }} /> : null;
}

interface TestPageProps extends ScrollRestoreProps {
  scrollerId: string;
  seedTop: number;
  anchorId?: string;
  lateAnchorDelay?: number;
}

function TestPage({
  scrollerId,
  seedTop,
  anchorId = 'anchor',
  lateAnchorDelay,
  ...props
}: TestPageProps) {
  return (
    <div id={scrollerId} style={{ height: 100, overflowY: 'auto' }}>
      <div style={{ position: 'relative', height: 2000 }}>
        {lateAnchorDelay === undefined ? (
          <div id={anchorId} style={{ position: 'absolute', top: 800 }} />
        ) : (
          <DelayedAnchor id={anchorId} delay={lateAnchorDelay} top={800} />
        )}
      </div>
      <div>
        <SeedScroll containerId={scrollerId} top={seedTop} />
        <ScrollRestore {...props} />
      </div>
    </div>
  );
}

test('scrolls to top when the URL has no hash', async () => {
  window.history.replaceState(null, '', window.location.pathname);
  await render(<TestPage scrollerId='scroller-no-hash' seedTop={400} />);

  expect(document.getElementById('scroller-no-hash')!.scrollTop).toBe(0);
});

test('scrolls to the anchor matching the hash', async () => {
  window.history.replaceState(null, '', '#anchor-hash');
  await render(<TestPage scrollerId='scroller-anchor' seedTop={100} anchorId='anchor-hash' />);

  expect(document.getElementById('scroller-anchor')!.scrollTop).toBe(800);
});

test('scrolls to top when the hash does not match any element', async () => {
  window.history.replaceState(null, '', '#missing-anchor');
  await render(<TestPage scrollerId='scroller-missing' seedTop={400} />);

  expect(document.getElementById('scroller-missing')!.scrollTop).toBe(0);
});

test('uses the scroll container returned by getContainer', async () => {
  window.history.replaceState(null, '', window.location.pathname);

  const external = document.createElement('div');
  external.dataset.testExternal = '';
  external.style.cssText = 'height: 100px; overflow-y: auto';
  external.innerHTML = '<div style="height: 2000px"></div>';
  document.body.append(external);
  external.scrollTop = 300;

  await render(<ScrollRestore getContainer={() => external} />);

  expect(external.scrollTop).toBe(0);
});

test('retries until an asynchronously rendered anchor appears', async () => {
  window.history.replaceState(null, '', '#late-anchor');
  await render(
    <TestPage
      scrollerId='scroller-late'
      seedTop={100}
      anchorId='late-anchor'
      lateAnchorDelay={50}
    />,
  );

  const scroller = document.getElementById('scroller-late')!;
  await vi.waitFor(() => expect(scroller.scrollTop).toBe(800));
});

test('restores scroll position on history navigation after mount', async () => {
  window.history.replaceState(null, '', window.location.pathname);
  await render(
    <TestPage scrollerId='scroller-navigation' anchorId='navigation-anchor' seedTop={400} />,
  );

  const scroller = document.getElementById('scroller-navigation')!;
  expect(scroller.scrollTop).toBe(0);

  window.history.pushState(null, '', '#navigation-anchor');
  await vi.waitFor(() => expect(scroller.scrollTop).toBe(800));

  window.history.pushState(null, '', window.location.pathname);
  await vi.waitFor(() => expect(scroller.scrollTop).toBe(0));
});
