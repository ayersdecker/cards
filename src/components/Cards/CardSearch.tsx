import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchCards } from '../../services/scryfall';
import { resolveBulkCardList } from '../../services/bulkImport';
import type { ScryfallCard } from '../../types';
import CardGrid from './CardGrid';
import CardRecognition from '../CardRecognition/CardRecognition';
import { useStorageSettings } from '../../context/StorageSettingsContext';

export default function CardSearch() {
  const { settings } = useStorageSettings();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  const popularSearches = [
    'Lightning Bolt',
    'Sol Ring',
    'Counterspell',
    'Swords to Plowshares',
    'Rhystic Study',
    'Dockside Extortionist',
    'Cyclonic Rift',
    'Smothering Tithe',
  ];

  useEffect(() => {
    const prefill = searchParams.get('q');
    if (!prefill) return;
    setQuery(prefill);
    setHasInteracted(true);
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasInteracted(true);
    setLoading(true);
    setError('');
    setBulkMessage('');
    try {
      const res = await searchCards(query.trim(), 1, {
        unique: settings.includeAllPrintings ? 'prints' : 'cards',
      });
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

    setHasInteracted(true);
    setBulkLoading(true);
    setError('');
    setBulkMessage('');

    try {
      const { resolved, missing } = await resolveBulkCardList(bulkInput, {
        preferredSetCode: settings.preferredSetCode,
      });
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
          onFocus={() => setHasInteracted(true)}
          onChange={(e) => {
            setHasInteracted(true);
            setQuery(e.target.value);
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {!hasInteracted && (
        <section className="popular-searches card-surface">
          <h3>Popular Searches</h3>
          <p className="muted">Start with a staple card or archetype favorite.</p>
          <div className="popular-searches-list">
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setHasInteracted(true);
                  setQuery(term);
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </section>
      )}
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
      <CardRecognition embedded />
      {total > 0 && <p className="results-count">{total} cards found</p>}
      <CardGrid cards={cards} />
    </div>
  );
}
