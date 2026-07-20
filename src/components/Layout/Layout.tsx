import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
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
        </footer>
      </div>
    </div>
  );
}
