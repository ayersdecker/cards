import React, { useState } from 'react';
import { searchCards } from '../../services/scryfall';
import type { ScryfallCard } from '../../types';
import CardGrid from './CardGrid';

export default function CardSearch() {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await searchCards(query.trim());
      setCards(res.data);
      setTotal(res.total_cards);
    } catch {
      setError('Search failed. Try a different query.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2 className="page-title">Card <span className="accent-magenta">Search</span></h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          className="search-input"
          type="text"
          placeholder="Search cards… e.g. 'Lightning Bolt'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <div className="error-msg">{error}</div>}
      {total > 0 && <p className="results-count">{total} cards found</p>}
      <CardGrid cards={cards} />
    </div>
  );
}
