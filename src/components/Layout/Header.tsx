import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/search', label: 'Search' },
    { to: '/collections', label: 'Collections' },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <Link to="/">
          <span className="brand-mtg">Redtail</span>
          <span className="brand-collection accent-cyan">Cards</span>
        </Link>
      </div>
      <nav className="header-nav">
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-link ${isActive(l.to) ? 'active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="header-controls">
        {user && (
          <div className="header-user">
            <span className="user-email">{user.email}</span>
            <Link to="/settings" className="btn btn-sm btn-ghost">
              Settings
            </Link>
            <button onClick={handleLogout} className="btn btn-sm btn-ghost">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
