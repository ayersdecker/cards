import React from 'react';
import { Link } from 'react-router-dom';

const POPULAR_SEARCHES = [
  'Lightning Bolt',
  'Sol Ring',
  'Counterspell',
  'Swords to Plowshares',
  'Rhystic Study',
  'Cyclonic Rift',
];

const MTG_NEWS_LINKS = [
  {
    title: 'Magic News - Wizards of the Coast',
    url: 'https://magic.wizards.com/en/news',
    description: 'Official announcements, set previews, and product updates.',
  },
  {
    title: 'DailyMTG',
    url: 'https://magic.wizards.com/en/news/daily-mtg',
    description: 'Regular articles, strategy pieces, and feature stories.',
  },
  {
    title: 'Wizards Event Locator',
    url: 'https://locator.wizards.com/',
    description: 'Find nearby stores and upcoming MTG events.',
  },
  {
    title: 'MTG on YouTube',
    url: 'https://www.youtube.com/@magic',
    description: 'Official videos, reveals, and event coverage.',
  },
];

export default function HomePage() {
  return (
    <div className="page home-page">
      <section className="home-hero card-surface">
        <p className="home-kicker">Welcome to Redtail</p>
        <h1 className="home-title">Build better Magic collections and decks faster.</h1>
        <p className="home-subtitle">
          Magic: The Gathering is a strategy card game with over 30 years of cards,
          formats, and archetypes. Redtail helps you search cards, organize collections,
          and tune decklists in one place.
        </p>
        <div className="home-actions">
          <Link to="/search" className="btn btn-primary">Search Cards</Link>
          <Link to="/collections" className="btn btn-ghost">Open Collections</Link>
        </div>
      </section>

      <section className="home-grid">
        <article className="card-surface home-card">
          <h2>What is MTG?</h2>
          <p>
            MTG is a trading card game where you build a deck and duel opponents using spells,
            creatures, and strategic resource management.
          </p>
        </article>

        <article className="card-surface home-card">
          <h2>Core Formats</h2>
          <p>Popular formats include Standard, Commander, Modern, and Pioneer.</p>
          <p>Commander decks are singleton and built around a legendary commander.</p>
        </article>

        <article className="card-surface home-card">
          <h2>Popular Searches</h2>
          <div className="home-popular-list">
            {POPULAR_SEARCHES.map((name) => (
              <Link key={name} to={`/search?q=${encodeURIComponent(name)}`} className="home-chip">
                {name}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="card-surface home-news-section">
        <h2>Recent MTG News and Resources</h2>
        <p className="muted">Official sources from Wizards of the Coast and Magic channels.</p>
        <div className="home-news-list">
          {MTG_NEWS_LINKS.map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="home-news-link"
            >
              <span className="home-news-title">{item.title}</span>
              <span className="home-news-desc">{item.description}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
