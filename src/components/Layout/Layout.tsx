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
      </div>
    </div>
  );
}
