import { type CSSProperties, useEffect, useLayoutEffect, useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ScrollRestore, type ScrollRestoreProps } from '../src';

afterEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
  window.scrollTo(0, 0);
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
  anchorStyle?: CSSProperties;
  containerStyle?: CSSProperties;
}

function TestPage({
  scrollerId,
  seedTop,
  anchorId = 'anchor',
  lateAnchorDelay,
  anchorStyle,
  containerStyle,
  ...props
}: TestPageProps) {
  return (
    <div id={scrollerId} style={{ height: 100, overflowY: 'auto', ...containerStyle }}>
      <div style={{ position: 'relative', height: 2000 }}>
        {lateAnchorDelay === undefined ? (
          <div id={anchorId} style={{ position: 'absolute', top: 800, ...anchorStyle }} />
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

test('respects the anchor scroll-margin-top', async () => {
  window.history.replaceState(null, '', '#anchor-margin');
  await render(
    <TestPage
      scrollerId='scroller-margin'
      seedTop={100}
      anchorId='anchor-margin'
      anchorStyle={{ scrollMarginTop: 80 }}
    />,
  );

  expect(document.getElementById('scroller-margin')!.scrollTop).toBe(720);
});

test('respects the container scroll-padding-top', async () => {
  window.history.replaceState(null, '', '#anchor-padding');
  await render(
    <TestPage
      scrollerId='scroller-padding'
      seedTop={100}
      anchorId='anchor-padding'
      containerStyle={{ scrollPaddingTop: 60 }}
    />,
  );

  expect(document.getElementById('scroller-padding')!.scrollTop).toBe(740);
});

test('combines the anchor scroll-margin-top and the container scroll-padding-top', async () => {
  window.history.replaceState(null, '', '#anchor-offset');
  await render(
    <TestPage
      scrollerId='scroller-offset'
      seedTop={100}
      anchorId='anchor-offset'
      anchorStyle={{ scrollMarginTop: 80 }}
      containerStyle={{ scrollPaddingTop: 60 }}
    />,
  );

  expect(document.getElementById('scroller-offset')!.scrollTop).toBe(660);
});

test('respects the anchor scroll-margin-top when scrolling the document', async () => {
  window.history.replaceState(null, '', '#document-anchor');
  window.scrollTo(0, 0);

  const spacer = document.createElement('div');
  spacer.dataset.testExternal = '';
  spacer.style.cssText = 'position: relative; height: 3000px';
  const anchor = document.createElement('div');
  anchor.id = 'document-anchor';
  anchor.style.cssText = 'position: absolute; top: 2000px; scroll-margin-top: 80px';
  spacer.append(anchor);
  document.body.append(spacer);
  const expected = anchor.getBoundingClientRect().top + window.scrollY - 80;

  await render(<ScrollRestore getContainer={() => document.documentElement} />);

  expect(window.scrollY).toBe(expected);
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

test('leaves the native history methods untouched', async () => {
  const pushState = window.history.pushState;
  const replaceState = window.history.replaceState;

  window.history.replaceState(null, '', window.location.pathname);
  await render(<TestPage scrollerId='scroller-history-api' seedTop={0} />);

  expect(window.history.pushState).toBe(pushState);
  expect(window.history.replaceState).toBe(replaceState);
});
