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
    { to: '/', label: 'Search' },
    { to: '/collections', label: 'Collections' },
    { to: '/decks', label: 'Decks' },
    { to: '/recognize', label: 'AI Scan' },
    { to: '/settings', label: 'Settings' },
  ];

  return (
    <header className="app-header">
      <div className="header-brand">
        <Link to="/">
          <span className="brand-mtg">MTG</span>
          <span className="brand-collection accent-cyan">Collection</span>
        </Link>
      </div>
      <nav className="header-nav">
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="header-user">
        {user && (
          <>
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="btn btn-sm btn-ghost">
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
