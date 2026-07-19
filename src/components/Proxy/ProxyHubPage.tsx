import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollections, useDecks } from '../../hooks/useFirestore';

export default function ProxyHubPage() {
  const { user } = useAuth();
  const { collections, loading: collectionsLoading } = useCollections(user?.uid ?? null);
  const { decks, loading } = useDecks(user?.uid ?? null);

  const rows = useMemo(() => {
    const deckRows = decks
      .map((deck) => {
        const queuedCount = deck.cards.reduce((sum, card) => sum + (card.proxyQueuedQuantity ?? 0), 0);
        const mainCount = deck.cards
          .filter((card) => !card.isSideboard)
          .reduce((sum, card) => sum + card.quantity, 0);
        const sideCount = deck.cards
          .filter((card) => card.isSideboard)
          .reduce((sum, card) => sum + card.quantity, 0);

        return {
          id: deck.id,
          sourceType: 'deck' as const,
          name: deck.name,
          subtitle: `Main: ${mainCount} | Side: ${sideCount}`,
          queuedCount,
          editTo: `/collections/deck/${deck.id}`,
        };
      })
      .filter((deck) => deck.queuedCount > 0);

    const collectionRows = collections
      .map((collection) => {
        const queuedCount = collection.cards.reduce((sum, card) => sum + (card.proxyQueuedQuantity ?? 0), 0);
        const totalQuantity = collection.cards.reduce((sum, card) => sum + card.quantity, 0);

        return {
          id: collection.id,
          sourceType: 'collection' as const,
          name: collection.name,
          subtitle: `${collection.cards.length} unique cards | Qty: ${totalQuantity}`,
          queuedCount,
          editTo: `/collections/${collection.id}`,
        };
      })
      .filter((collection) => collection.queuedCount > 0);

    return [...deckRows, ...collectionRows]
      .sort((a, b) => b.queuedCount - a.queuedCount || a.name.localeCompare(b.name));
  }, [collections, decks]);

  const isLoading = loading || collectionsLoading;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Proxy Print Queue</h2>
      </div>
      <p className="muted">
        Queue cards from either collections or decks, then print from here.
      </p>

      {isLoading && <p>Loading…</p>}

      {!isLoading && rows.length === 0 && (
        <div className="card-surface proxy-empty-state">
          <h3>No proxy cards queued</h3>
          <p className="muted">Open any deck or collection and add cards to the proxy queue.</p>
          <Link to="/collections" className="btn btn-primary">Open Collections</Link>
        </div>
      )}

      {rows.length > 0 && (
        <div className="list-grid">
          {rows.map((row) => (
            <div key={row.id} className="list-card">
              <Link to={row.editTo} className="list-card-name">{row.name}</Link>
              <div className="list-card-tag">{row.sourceType}</div>
              <div className="list-card-meta">{row.subtitle}</div>
              <div className="proxy-queued-pill">Queued Proxies: {row.queuedCount}</div>
              <div className="list-card-actions">
                <Link to={`/proxies/${row.sourceType}/${row.id}`} className="btn btn-sm btn-primary">Print Queue</Link>
                <Link to={row.editTo} className="btn btn-sm btn-ghost">Edit</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
