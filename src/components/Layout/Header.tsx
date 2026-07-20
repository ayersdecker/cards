import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoSrc = `${import.meta.env.BASE_URL}logo-hawk.svg`;

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/search', label: 'Search' },
    { to: '/collections', label: 'Collections' },
    { to: '/proxies', label: 'Proxies' },
    { to: '/trade', label: 'Trade' },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <Link to="/">
          <img src={logoSrc} alt="Redtail hawk" className="brand-logo" />
          <span className="brand-mtg">Redtail</span>
          <span className="brand-collection accent-cyan">Cards</span>
        </Link>
      </div>

      <button
        type="button"
        className="mobile-menu-toggle"
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-header-menu"
        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        <span className={`hamburger-icon ${mobileMenuOpen ? 'is-open' : ''}`} aria-hidden="true">
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </span>
      </button>

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

      <div
        id="mobile-header-menu"
        className={`mobile-menu-panel ${mobileMenuOpen ? 'open' : ''}`}
      >
        <nav className="mobile-menu-nav" aria-label="Mobile navigation">
          {navLinks.map((l) => (
            <Link
              key={`mobile-${l.to}`}
              to={l.to}
              className={`mobile-menu-link ${isActive(l.to) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="mobile-menu-user">
            <p className="user-email">{user.email}</p>
            <div className="mobile-menu-actions">
              <Link
                to="/settings"
                className="btn btn-sm btn-ghost"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button onClick={() => void handleLogout()} className="btn btn-sm btn-ghost">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
