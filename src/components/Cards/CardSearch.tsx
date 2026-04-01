import React, { useState } from 'react';
import { searchCards } from '../../services/scryfall';
import { resolveBulkCardList } from '../../services/bulkImport';
import type { ScryfallCard } from '../../types';
import CardGrid from './CardGrid';

export default function CardSearch() {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setBulkMessage('');
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

  const handleBulkSearch = async () => {
    if (!bulkInput.trim()) return;

    setBulkLoading(true);
    setError('');
    setBulkMessage('');

    try {
      const { resolved, missing } = await resolveBulkCardList(bulkInput);
      const uniqueCards = resolved.map((entry) => entry.card);

      setCards(uniqueCards);
      setTotal(uniqueCards.length);
      setBulkMessage(
        missing.length > 0
          ? `Found ${uniqueCards.length} cards. Missing: ${missing.join(', ')}`
          : `Found ${uniqueCards.length} cards from your list.`
      );
    } catch (searchError: unknown) {
      setError(searchError instanceof Error ? searchError.message : 'Bulk search failed');
      setCards([]);
      setTotal(0);
    } finally {
      setBulkLoading(false);
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
      <section className="bulk-import-card">
        <div className="bulk-import-head">
          <div>
            <h3>Bulk Card Search</h3>
            <p className="muted">Paste one card per line. Supports `4 Lightning Bolt`, `Lightning Bolt x4`, and set-specific entries like `Lightning Bolt [M11]`.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleBulkSearch}
            disabled={bulkLoading || !bulkInput.trim()}
          >
            {bulkLoading ? 'Searching…' : 'Search List'}
          </button>
        </div>
        <textarea
          className="bulk-import-input"
          placeholder={"Lightning Bolt\nCounterspell\nSol Ring"}
          value={bulkInput}
          onChange={(event) => setBulkInput(event.target.value)}
          rows={6}
        />
      </section>
      {error && <div className="error-msg">{error}</div>}
      {bulkMessage && <div className="success-msg">{bulkMessage}</div>}
      {total > 0 && <p className="results-count">{total} cards found</p>}
      <CardGrid cards={cards} />
    </div>
  );
}
