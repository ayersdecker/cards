import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Header from './Header';
import AdUnit from './AdUnit';

export default function Layout() {
  return (
    <>
      <aside className="ad-rail ad-rail-left" aria-label="Left advertisement space">
        <AdUnit />
      </aside>
      <aside className="ad-rail ad-rail-right" aria-label="Right advertisement space">
        <AdUnit />
      </aside>
      <div className="app-layout">
        <div className="app-atmosphere" aria-hidden="true">
          <span className="orb orb-one" />
          <span className="orb orb-two" />
          <span className="orb orb-three" />
        </div>
        <div className="app-shell">
          <Header />
          <main className="app-main reveal-in">
            <Outlet />
          </main>
          <footer className="app-footer">
            <p>
              Built by Decker Ayers. Visit{' '}
              <a href="https://www.deckerayers.com" target="_blank" rel="noreferrer">
                www.deckerayers.com
              </a>
              {' '}| Github:{' '}
              <a href="https://github.com/ayersdecker" target="_blank" rel="noreferrer">
                @ayersdecker
              </a>
              {' '}| Instagram:{' '}
              <a href="https://www.instagram.com/iamdeckerayers" target="_blank" rel="noreferrer">
                @iamdeckerayers
              </a>
              {' '}| YouTube:{' '}
              <a href="https://www.youtube.com/@IAmDeckerAyers" target="_blank" rel="noreferrer">
                IAmDeckerAyers
              </a>
              .
            </p>
            <nav className="footer-info-links" aria-label="Site information">
              <Link to="/about">About</Link>
              <Link to="/guides">Guides</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </nav>
          </footer>
      </div>
      </div>
    </>
  );
}
