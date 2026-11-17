import type { ReactNode } from 'react';
import { Link, Route, Router, Switch, useLocation } from 'wouter';

import { ScrollRestore } from '../../src';

const SECTIONS = [1, 2, 3, 4, 5, 6];
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

function Page({ prefix, title }: { prefix: string; title: string }) {
  return (
    <article>
      <h2>{title}</h2>
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
        {SECTIONS.map((section) => (
          <a key={section} href={`#${prefix}-${section}`}>
            Same-page #{prefix}-{section}
          </a>
        ))}
      </nav>
      {SECTIONS.map((section) => (
        <section
          key={section}
          id={`${prefix}-${section}`}
          style={{ minHeight: '60vh', borderTop: '1px solid #414141', paddingTop: '1rem' }}
        >
          <h3>
            {title} · Section {section}
          </h3>
        </section>
      ))}
    </article>
  );
}

function Scroller({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div id='scroller' style={{ height: '100vh', overflowY: 'auto' }}>
      <ScrollRestore key={location} />
      {children}
    </div>
  );
}

export function App() {
  return (
    <Router base={base}>
      <Scroller>
        <div
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            opacity: 0.6,
          }}
        >
          Scroll Down ↓
        </div>
        <header>
          <h1>react-scroll-restore</h1>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
            <Link href='/'>Home (no hash)</Link>
            <Link href='/about'>New page (no hash)</Link>
            <Link href='/about#about-3'>New page (with #about-3)</Link>
          </nav>
        </header>
        <Switch>
          <Route path='/'>
            <Page prefix='home' title='Home' />
          </Route>
          <Route path='/about'>
            <Page prefix='about' title='About' />
          </Route>
          <Route>
            <p>Not found</p>
          </Route>
        </Switch>
      </Scroller>
    </Router>
  );
}
