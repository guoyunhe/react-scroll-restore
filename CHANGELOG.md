# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `ScrollRestore` component that scrolls to the element matching `window.location.hash` when mounted, or to the top when there is no hash.
- Reacts to later navigations (`pushState`, `replaceState`, `popstate`, and `hashchange`) and restores the scroll position accordingly.
- `getContainer` prop to scroll a specific element instead of the nearest scrollable ancestor; falls back to the document scrolling element when there is no scrollable ancestor.
- `behavior` prop (`'auto'` or `'smooth'`) to control the scroll animation.
- Retry logic for anchors that are rendered asynchronously (up to 30 animation frames).
- Wouter-based playground covering new-page navigation with and without a hash, plus same-page hash links.
- GitHub Pages deployment of the playground, including project base path and a `404.html` SPA fallback for deep links.

### Changed

- The Pages workflow now deploys the playground instead of the placeholder docs site.

### Removed

- Template `MyButton` component and its test.

[Unreleased]: https://github.com/guoyunhe/react-scroll-restore/commits/main
