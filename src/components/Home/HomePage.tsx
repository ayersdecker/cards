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
    </div>
  );
}
