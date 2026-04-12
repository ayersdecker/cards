import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchCards } from '../../services/scryfall';
import { resolveBulkCardList, type ResolvedListEntry } from '../../services/bulkImport';
import type { CollectionCard, ScryfallCard } from '../../types';
import CardGrid from './CardGrid';
import CardRecognition from '../CardRecognition/CardRecognition';
import { useStorageSettings } from '../../context/StorageSettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useCollections } from '../../hooks/useFirestore';

export default function CardSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useStorageSettings();
  const { collections, createCollection, updateCollection } = useCollections(user?.uid ?? null);
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
  const [bulkResolved, setBulkResolved] = useState<ResolvedListEntry[]>([]);
  const [bulkMissing, setBulkMissing] = useState<string[]>([]);
  const [bulkImportMode, setBulkImportMode] = useState<'existing' | 'new'>('existing');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    if (!selectedCollectionId && collections.length > 0) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

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
    setBulkResolved([]);
    setBulkMissing([]);
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
      setBulkResolved(resolved);
      setBulkMissing(missing);
      setBulkMessage(
        missing.length > 0
          ? `Found ${uniqueCards.length} cards. Missing: ${missing.join(', ')}`
          : `Found ${uniqueCards.length} cards from your list.`
      );
    } catch (searchError: unknown) {
      setError(searchError instanceof Error ? searchError.message : 'Bulk search failed');
      setCards([]);
      setTotal(0);
      setBulkResolved([]);
      setBulkMissing([]);
    } finally {
      setBulkLoading(false);
    }
  };

  const mergeBulkEntriesIntoCollectionCards = (
    existingCards: CollectionCard[],
    entries: ResolvedListEntry[]
  ): CollectionCard[] => {
    const nextCards = [...existingCards];

    for (const entry of entries) {
      const existing = nextCards.find((card) => card.scryfallId === entry.card.id);
      if (existing) {
        existing.quantity += entry.quantity;
        continue;
      }

      nextCards.push({
        scryfallId: entry.card.id,
        name: entry.card.name,
        set: entry.card.set,
        set_name: entry.card.set_name,
        price: entry.card.prices.usd,
        colors: entry.card.colors ?? [],
        imageUri: entry.card.image_uris?.normal ?? entry.card.card_faces?.[0]?.image_uris?.normal ?? '',
        addedAt: Date.now(),
        quantity: entry.quantity,
        cmc: entry.card.cmc,
        type_line: entry.card.type_line,
        mana_cost: entry.card.mana_cost,
      });
    }

    return nextCards;
  };

  const handleAddAllToCollection = async () => {
    if (!user) {
      setError('Sign in to add bulk cards to a collection.');
      return;
    }

    if (bulkResolved.length === 0) {
      setError('Run bulk search first so there are cards to add.');
      return;
    }

    setAddingAll(true);
    setError('');

    try {
      if (bulkImportMode === 'new') {
        const name = newCollectionName.trim();
        if (!name) {
          setError('Enter a name for the new collection.');
          return;
        }

        const newCollectionId = await createCollection(name);
        if (!newCollectionId) {
          throw new Error('Unable to create a new collection.');
        }

        const newCards = mergeBulkEntriesIntoCollectionCards([], bulkResolved);
        await updateCollection(newCollectionId, { cards: newCards });
        setBulkMessage(`Created ${name} and added ${bulkResolved.length} card entries.`);
        navigate(`/collections/${newCollectionId}`);
        return;
      }

      if (!selectedCollectionId) {
        setError('Select a collection to import into.');
        return;
      }

      const target = collections.find((collection) => collection.id === selectedCollectionId);
      if (!target) {
        setError('Selected collection is no longer available.');
        return;
      }

      const nextCards = mergeBulkEntriesIntoCollectionCards(target.cards, bulkResolved);
      await updateCollection(target.id, { cards: nextCards });
      setBulkMessage(`Added ${bulkResolved.length} card entries to ${target.name}.`);
    } catch (importError: unknown) {
      setError(importError instanceof Error ? importError.message : 'Unable to add cards to collection.');
    } finally {
      setAddingAll(false);
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
      {error && <div className="error-msg">{error}</div>}
      {total > 0 && <p className="results-count">{total} cards found</p>}
      <CardGrid cards={cards} />
      <section className="bulk-import-card search-bulk-panel">
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
        {bulkResolved.length > 0 && (
          <div className="bulk-import-destination">
            <h4>Send Bulk Results To Collection</h4>
            <div className="bulk-import-mode-row" role="tablist" aria-label="Bulk import destination type">
              <button
                type="button"
                className={`bulk-mode-btn ${bulkImportMode === 'existing' ? 'active' : ''}`}
                onClick={() => setBulkImportMode('existing')}
                aria-pressed={bulkImportMode === 'existing'}
              >
                Existing Collection
              </button>
              <button
                type="button"
                className={`bulk-mode-btn ${bulkImportMode === 'new' ? 'active' : ''}`}
                onClick={() => setBulkImportMode('new')}
                aria-pressed={bulkImportMode === 'new'}
              >
                New Collection
              </button>
            </div>

            {bulkImportMode === 'existing' ? (
              <select
                value={selectedCollectionId}
                onChange={(event) => setSelectedCollectionId(event.target.value)}
                disabled={collections.length === 0}
              >
                {collections.length === 0 && <option value="">No collections yet</option>}
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>{collection.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="New collection name"
                value={newCollectionName}
                onChange={(event) => setNewCollectionName(event.target.value)}
              />
            )}

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleAddAllToCollection}
              disabled={addingAll || !user}
            >
              {addingAll
                ? 'Adding…'
                : bulkImportMode === 'new'
                  ? 'Create Collection + Add All'
                  : 'Add All To Collection'}
            </button>

            <p className="muted">Ready to add {bulkResolved.length} matched entries in one step.</p>
            {!user && (
              <p className="muted">Sign in to bulk-add results to collections.</p>
            )}
          </div>
        )}
        {bulkMissing.length > 0 && (
          <p className="muted bulk-missing-list">Unmatched entries: {bulkMissing.join(', ')}</p>
        )}
      </section>
      {bulkMessage && <div className="success-msg">{bulkMessage}</div>}
      <CardRecognition embedded />
    </div>
  );
}
