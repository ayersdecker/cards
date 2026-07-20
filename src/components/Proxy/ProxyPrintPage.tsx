import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollections, useDecks } from '../../hooks/useFirestore';

interface PrintTile {
  key: string;
  name: string;
  imageUri: string;
  setName: string;
}

export default function ProxyPrintPage() {
  const { id, sourceType } = useParams<{ id: string; sourceType?: 'deck' | 'collection' }>();
  const { user } = useAuth();
  const { collections, updateCollection } = useCollections(user?.uid ?? null);
  const { decks, updateDeck } = useDecks(user?.uid ?? null);
  const resolvedSourceType = sourceType ?? 'deck';
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState('');
  const [clearMessage, setClearMessage] = useState('');

  const deck = resolvedSourceType === 'deck' ? decks.find((entry) => entry.id === id) : null;
  const collection = resolvedSourceType === 'collection'
    ? collections.find((entry) => entry.id === id)
    : null;

  const tiles = useMemo<PrintTile[]>(() => {
    const sourceCards = deck?.cards ?? collection?.cards ?? [];
    if (sourceCards.length === 0) return [];

    const expanded: PrintTile[] = [];

    for (const card of sourceCards) {
      const quantity = Math.max(0, card.proxyQueuedQuantity ?? 0);
      for (let index = 0; index < quantity; index += 1) {
        expanded.push({
          key: `${card.scryfallId}-${'isSideboard' in card && card.isSideboard ? 'side' : 'main'}-${index}`,
          name: card.name,
          imageUri: card.imageUri,
          setName: card.set_name,
        });
      }
    }

    return expanded;
  }, [collection, deck]);

  const sortedTiles = useMemo(
    () => [...tiles].sort((a, b) => a.name.localeCompare(b.name) || a.setName.localeCompare(b.setName)),
    [tiles]
  );

  const sourceName = deck?.name ?? collection?.name;
  const sourceLabel = deck ? 'Deck' : 'Collection';
  const logoSrc = `${import.meta.env.BASE_URL}logo-hawk.svg`;
  const editLink = deck ? `/collections/deck/${deck.id}` : collection ? `/collections/${collection.id}` : '/collections';
  const [printDensity, setPrintDensity] = useState<'super' | 'balanced' | 'loose'>('super');

  const clearCurrentQueue = async () => {
    setClearLoading(true);
    setClearError('');
    setClearMessage('');

    try {
      if (deck) {
        const nextCards = deck.cards.map((card) => ({
          ...card,
          proxyQueuedQuantity: 0,
        }));
        await updateDeck(deck.id, { cards: nextCards });
        setClearMessage(`Cleared queue for ${deck.name}.`);
        return;
      }

      if (collection) {
        const nextCards = collection.cards.map((card) => ({
          ...card,
          proxyQueuedQuantity: 0,
        }));
        await updateCollection(collection.id, { cards: nextCards });
        setClearMessage(`Cleared queue for ${collection.name}.`);
      }
    } catch {
      setClearError('Failed to clear queued proxies.');
    } finally {
      setClearLoading(false);
    }
  };

  if (!sourceName) {
    return (
      <div className="page">
        <p>{resolvedSourceType === 'collection' ? 'Collection not found.' : 'Deck not found.'}</p>
      </div>
    );
  }


  return (
    <div className={`page proxy-print-page print-mode-${printDensity}`}>
      <div className="page-header proxy-print-header">
        <Link to="/proxies" className="back-link">← Back to Proxies</Link>
        <h2 className="page-title">{sourceName}</h2>
        <button
          type="button"
          className="btn btn-danger proxy-print-btn"
          onClick={() => void clearCurrentQueue()}
          disabled={clearLoading}
        >
          {clearLoading ? 'Clearing…' : 'Clear Queue'}
        </button>
        <button type="button" className="btn btn-primary proxy-print-btn" onClick={() => window.print()}>
          Print
        </button>
      </div>
      {clearError && <div className="error-msg">{clearError}</div>}
      {clearMessage && <div className="success-msg">{clearMessage}</div>}
      <div className="proxy-print-mode-row" role="group" aria-label="Print density mode">
        <button
          type="button"
          className={`proxy-print-mode-btn ${printDensity === 'super' ? 'active' : ''}`}
          onClick={() => setPrintDensity('super')}
        >
          Compact
        </button>
        <button
          type="button"
          className={`proxy-print-mode-btn ${printDensity === 'balanced' ? 'active' : ''}`}
          onClick={() => setPrintDensity('balanced')}
        >
          Balanced
        </button>
        <button
          type="button"
          className={`proxy-print-mode-btn ${printDensity === 'loose' ? 'active' : ''}`}
          onClick={() => setPrintDensity('loose')}
        >
          Loose
        </button>
      </div>
      <section className="proxy-print-hero card-surface">
        <div className="proxy-print-hero-row">
          <img src={logoSrc} alt="Redtail" className="proxy-print-logo" />
          <span className="proxy-source-pill">{sourceLabel}</span>
          <strong className="proxy-print-source-name">{sourceName}</strong>
          {user?.email && <span className="proxy-print-user-email muted">{user.email}</span>}
        </div>
      </section>
      {printDensity === 'loose' && (
        <p className="proxy-cut-hint muted">Loose mode: follow dotted outlines and "Cut here" labels for easy trimming.</p>
      )}
      <p className="muted proxy-print-note">
        Print at 100% scale. Card size is fixed to standard 63mm x 88mm in all modes. Queue total: {tiles.length}
      </p>

      {tiles.length === 0 ? (
        <div className="card-surface proxy-empty-state">
          <h3>No queued proxy cards</h3>
          <p className="muted">Go back and add cards to this source&apos;s proxy queue.</p>
          <Link to={editLink} className="btn btn-primary">Open Source</Link>
        </div>
      ) : (
        <div className="proxy-print-sheet">
          <div className="proxy-print-grid">
            {sortedTiles.map((tile) => (
              <article key={tile.key} className="proxy-print-tile">
                {tile.imageUri ? (
                  <img src={tile.imageUri} alt={tile.name} className="proxy-print-image" />
                ) : (
                  <div className="proxy-print-placeholder">{tile.name}</div>
                )}
                <div className="proxy-print-meta">
                  <span>{tile.name}</span>
                  <span className="muted">{tile.setName}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
