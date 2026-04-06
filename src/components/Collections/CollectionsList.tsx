import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollections, useDecks } from '../../hooks/useFirestore';

export default function CollectionsList() {
  const { user } = useAuth();
  const { collections, loading, createCollection, deleteCollection, updateCollection } =
    useCollections(user?.uid ?? null);
  const {
    decks,
    loading: decksLoading,
    createDeck,
    deleteDeck,
    updateDeck,
  } = useDecks(user?.uid ?? null);
  const [newName, setNewName] = useState('');
  const [showCreateSetup, setShowCreateSetup] = useState(false);
  const [createKind, setCreateKind] = useState<'collection' | 'deck'>('collection');
  const [createCommanderDeck, setCreateCommanderDeck] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renamingKind, setRenamingKind] = useState<'collection' | 'deck'>('collection');
  const [renameVal, setRenameVal] = useState('');
  const [onlyDecks, setOnlyDecks] = useState(false);

  const portfolioValue = useMemo(() => {
    const collectionValue = collections.reduce((sum, collection) => {
      return sum + collection.cards.reduce((inner, card) => inner + (parseFloat(card.price ?? '0') || 0) * card.quantity, 0);
    }, 0);

    const deckValue = decks.reduce((sum, deck) => {
      return sum + deck.cards.reduce((inner, card) => inner + (parseFloat(card.price ?? '0') || 0) * card.quantity, 0);
    }, 0);

    return collectionValue + deckValue;
  }, [collections, decks]);

  const portfolioCardCount = useMemo(() => {
    const collectionCards = collections.reduce((sum, collection) => sum + collection.cards.reduce((inner, card) => inner + card.quantity, 0), 0);
    const deckCards = decks.reduce((sum, deck) => sum + deck.cards.reduce((inner, card) => inner + card.quantity, 0), 0);
    return collectionCards + deckCards;
  }, [collections, decks]);

  const resetCreateSetup = () => {
    setShowCreateSetup(false);
    setNewName('');
    setCreateKind('collection');
    setCreateCommanderDeck(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (createKind === 'deck') {
      await createDeck(newName.trim(), {
        isCommander: createCommanderDeck,
      });
    } else {
      await createCollection(newName.trim());
    }

    resetCreateSetup();
  };

  const handleRename = async (id: string, kind: 'collection' | 'deck') => {
    if (!renameVal.trim()) return;

    if (kind === 'deck') {
      await updateDeck(id, { name: renameVal.trim() });
    } else {
      await updateCollection(id, { name: renameVal.trim() });
    }

    setRenaming(null);
  };

  const items = [
    ...collections.map((collection) => ({
      id: collection.id,
      kind: 'collection' as const,
      name: collection.name,
      cardsCount: collection.cards.length,
      totalQuantity: collection.cards.reduce((sum, card) => sum + card.quantity, 0),
      isCommander: false,
      to: `/collections/${collection.id}`,
    })),
    ...decks.map((deck) => {
      const mainCount = deck.cards
        .filter((card) => !card.isSideboard)
        .reduce((sum, card) => sum + card.quantity, 0);
      const sideCount = deck.cards
        .filter((card) => card.isSideboard)
        .reduce((sum, card) => sum + card.quantity, 0);
      return {
        id: deck.id,
        kind: 'deck' as const,
        name: deck.name,
        cardsCount: deck.cards.length,
        totalQuantity: mainCount + sideCount,
        mainCount,
        sideCount,
        isCommander: !!deck.isCommander,
        to: `/collections/deck/${deck.id}`,
      };
    }),
  ]
    .filter((item) => (onlyDecks ? item.kind === 'deck' : true))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page">
      <h2 className="page-title">My <span className="accent-cyan">Collections</span></h2>
      <section className="portfolio-panel card-surface">
        <div className="portfolio-row">
          <div>
            <h3>Portfolio Value</h3>
            <p className="muted">Collections + decks tracked value</p>
          </div>
          <strong className="portfolio-value">${portfolioValue.toFixed(2)}</strong>
        </div>
        <div className="portfolio-stats muted">
          <span>{collections.length} collections</span>
          <span>{decks.length} decks</span>
          <span>{portfolioCardCount} total cards</span>
        </div>
      </section>
      {!showCreateSetup && (
        <div className="create-launch-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateSetup(true)}
          >
            Create New
          </button>
        </div>
      )}
      {showCreateSetup && (
        <form onSubmit={handleCreate} className="create-form create-setup-panel card-surface">
          <select
            value={createKind}
            onChange={(event) => setCreateKind(event.target.value as 'collection' | 'deck')}
            aria-label="Select item type"
          >
            <option value="collection">Collection</option>
            <option value="deck">Deck</option>
          </select>
          <input
            placeholder={createKind === 'deck' ? 'New deck name…' : 'New collection name…'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          {createKind === 'deck' && (
            <label className="deck-mode-toggle" htmlFor="create-commander-toggle">
              <input
                id="create-commander-toggle"
                type="checkbox"
                checked={createCommanderDeck}
                onChange={(event) => setCreateCommanderDeck(event.target.checked)}
              />
              Commander format
            </label>
          )}
          <div className="create-setup-actions">
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" className="btn btn-ghost" onClick={resetCreateSetup}>Cancel</button>
          </div>
        </form>
      )}
      <div className="collections-toolbar">
        <button
          type="button"
          className={`collections-filter-toggle ${onlyDecks ? 'active' : ''}`}
          onClick={() => setOnlyDecks((prev) => !prev)}
          aria-pressed={onlyDecks}
        >
          Show Only Decks: {onlyDecks ? 'On' : 'Off'}
        </button>
      </div>
      {(loading || decksLoading) && <p>Loading…</p>}
      <div className="list-grid">
        {items.map((item) => (
          <div key={`${item.kind}-${item.id}`} className="list-card">
            {renaming === item.id ? (
              <div className="rename-row">
                <input
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  autoFocus
                />
                <button className="btn btn-sm btn-primary" onClick={() => handleRename(item.id, renamingKind)}>Save</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setRenaming(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <Link to={item.to} className="list-card-name">
                  {item.name}
                </Link>
                <div className="list-card-tag">{item.kind}</div>
                {item.kind === 'deck' && item.isCommander && <div className="list-card-tag">Commander</div>}
                <div className="list-card-meta">
                  {item.kind === 'deck'
                    ? `Main: ${item.mainCount} | Side: ${item.sideCount}`
                    : `${item.cardsCount} unique cards · Qty: ${item.totalQuantity}`}
                </div>
                <div className="list-card-actions">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setRenaming(item.id);
                      setRenamingKind(item.kind);
                      setRenameVal(item.name);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (item.kind === 'deck') {
                        void deleteDeck(item.id);
                        return;
                      }
                      void deleteCollection(item.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
