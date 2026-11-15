# react-scroll-restore

A lightweight, router-agnostic scroll restoration and hash positioning library for React.

Unlike router-specific solutions (like React Router's `<ScrollRestoration>`), `react-scroll-restore` operates purely on the native History API and URL changes. This means it works seamlessly with **any** routing solution—whether you are using **Wouter, React Router, TanStack Router, HashRouter, or even a custom setup**.

## ✨ Features

- **🛡️ Router-Agnostic**: Zero coupling with router libraries. Drop it into any React application.
- **🔄 Predictable Positioning**: Scrolls to the top on navigation without a hash and to the matching anchor when a hash is present.
- **⚓ Built-in Hash Navigation**: Handles URL hash fragments (`#target-id`) smoothly, with built-in retry logic for async-rendered content.
- **📐 Sticky-Header Aware**: Honors the target's `scroll-margin-top` and the scroll container's `scroll-padding-top`, so anchors are not hidden behind fixed headers.
- **🪶 Lightweight & Modern**: Built with React Hooks, zero heavy dependencies, and optimized for performance.

## 🤔 Why scroll restoration?

Client-side routing replaces the content of the page without a full browser navigation. The browser does not know that the "page" changed, so it keeps the scroll offset of the previous route and does not scroll to the new URL's hash. The result is easy to reproduce:

- You scroll to the bottom of a long list, click a link, and the next page opens already scrolled to the bottom instead of the top.
- You open `/posts#comments` directly and the anchor is ignored, or the page jumps before the target has rendered.
- Your layout scrolls a container with `overflow: auto` instead of the document, and native anchor navigation scrolls the wrong element or nothing at all.

`react-scroll-restore` handles these cases for you:

- Resets to the top when navigating to a URL without a hash.
- Scrolls to `#target` when the URL has a hash, retrying while the target is still rendering.
- Attaches to the nearest scrollable container, or to the element returned by `getContainer`.
- Listens to the History API and `hashchange`, so it works with Wouter, React Router, TanStack Router, or a custom router.

## 🚀 Installation

```bash
npm install --save react-scroll-restore
```

## 📖 Usage

Place `<ScrollRestore />` inside the element you want to scroll. On mount, and on every later navigation (`pushState`, `replaceState`, `popstate`, or `hashchange`), it inspects `window.location.hash` and either scrolls to the matching element or, when there is no hash, back to the top.

```tsx
import { ScrollRestore } from 'react-scroll-restore';

export function App() {
  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <ScrollRestore />
      <main>
        <h1>Page title</h1>
        <section id='features'>...</section>
      </main>
    </div>
  );
}
```

The scroll container is resolved in this order:

1. The element returned by the `getContainer` prop, when provided.
2. The nearest scrollable ancestor of `<ScrollRestore />` (a parent whose computed `overflow-y` is `auto`, `scroll`, or `overlay`).
3. The document scrolling element.

If the hashed element is rendered asynchronously (for example after data loading), `<ScrollRestore />` keeps looking for it for up to 30 animation frames.

Anchor positioning follows native fragment navigation: the target's `scroll-margin-top` and the scroll container's `scroll-padding-top` are subtracted from the scroll position. Set one of them (for example `scroll-margin-top: 5rem` on headings) to keep anchors clear of sticky headers.

### `getContainer`

Use `getContainer` to scroll a specific element instead of relying on the nearest scrollable ancestor:

```tsx
import { useRef } from 'react';
import { ScrollRestore } from 'react-scroll-restore';

export function Page() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} style={{ height: '100vh', overflowY: 'auto' }}>
      <ScrollRestore getContainer={() => containerRef.current} />
      <main>...</main>
    </div>
  );
}
```

### Props

| Prop           | Type                        | Default  | Description                                                                   |
| -------------- | --------------------------- | -------- | ----------------------------------------------------------------------------- |
| `getContainer` | `() => HTMLElement \| null` | —        | Returns the element to scroll. Falls back to the nearest scrollable ancestor. |
| `behavior`     | `ScrollBehavior`            | `'auto'` | Scroll behavior passed to `scrollTo` (`'auto'` or `'smooth'`).                |

## 🎮 Playground

```bash
pnpm play
```

The playground uses [Wouter](https://github.com/molefrog/wouter) to cover three scenarios:

- Navigating to a new page without a hash scrolls to the top.
- Navigating to a new page with a hash (e.g. `/about#about-3`) scrolls to that anchor.
- Clicking a same-page hash link (e.g. `#home-3`) scrolls to that anchor.

### Deployment

Every push to `main` builds the playground and publishes it to GitHub Pages at <https://guoyunhe.github.io/react-scroll-restore/> via [`.github/workflows/pages.yaml`](.github/workflows/pages.yaml). The build uses `PLAYGROUND_BASE=/react-scroll-restore/`, and `index.html` is copied to `404.html` so client-side routes survive deep links on GitHub Pages.

Enable Pages once in **Settings → Pages → Source: GitHub Actions** before the first deployment.
