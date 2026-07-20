import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollections, useDecks } from '../../hooks/useFirestore';

export default function ProxyHubPage() {
  const { user } = useAuth();
  const { collections, loading: collectionsLoading, updateCollection } = useCollections(user?.uid ?? null);
  const { decks, loading, updateDeck } = useDecks(user?.uid ?? null);
  const [queueActionLoading, setQueueActionLoading] = useState(false);
  const [queueActionError, setQueueActionError] = useState('');
  const [queueActionMessage, setQueueActionMessage] = useState('');

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

  const clearQueueForSource = async (sourceType: 'deck' | 'collection', sourceId: string) => {
    setQueueActionLoading(true);
    setQueueActionError('');
    setQueueActionMessage('');

    try {
      if (sourceType === 'deck') {
        const targetDeck = decks.find((deck) => deck.id === sourceId);
        if (!targetDeck) return;

        const nextCards = targetDeck.cards.map((card) => ({
          ...card,
          proxyQueuedQuantity: 0,
        }));

        await updateDeck(sourceId, { cards: nextCards });
        setQueueActionMessage(`Cleared proxy queue for ${targetDeck.name}.`);
        return;
      }

      const targetCollection = collections.find((collection) => collection.id === sourceId);
      if (!targetCollection) return;

      const nextCards = targetCollection.cards.map((card) => ({
        ...card,
        proxyQueuedQuantity: 0,
      }));

      await updateCollection(sourceId, { cards: nextCards });
      setQueueActionMessage(`Cleared proxy queue for ${targetCollection.name}.`);
    } catch {
      setQueueActionError('Could not clear this proxy queue.');
    } finally {
      setQueueActionLoading(false);
    }
  };

  const clearAllQueues = async () => {
    if (rows.length === 0) return;

    setQueueActionLoading(true);
    setQueueActionError('');
    setQueueActionMessage('');

    try {
      await Promise.all(
        rows.map(async (row) => {
          if (row.sourceType === 'deck') {
            const targetDeck = decks.find((deck) => deck.id === row.id);
            if (!targetDeck) return;

            const nextCards = targetDeck.cards.map((card) => ({
              ...card,
              proxyQueuedQuantity: 0,
            }));

            await updateDeck(row.id, { cards: nextCards });
            return;
          }

          const targetCollection = collections.find((collection) => collection.id === row.id);
          if (!targetCollection) return;

          const nextCards = targetCollection.cards.map((card) => ({
            ...card,
            proxyQueuedQuantity: 0,
          }));

          await updateCollection(row.id, { cards: nextCards });
        })
      );

      setQueueActionMessage('Cleared all proxy queues.');
    } catch {
      setQueueActionError('Could not clear all proxy queues.');
    } finally {
      setQueueActionLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Proxy Print Queue</h2>
      </div>
      <p className="muted">
        Queue cards from either collections or decks, then print from here.
      </p>

      {rows.length > 0 && (
        <div className="proxy-queue-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => void clearAllQueues()}
            disabled={queueActionLoading}
          >
            Clear All Queues
          </button>
        </div>
      )}

      {queueActionError && <div className="error-msg">{queueActionError}</div>}
      {queueActionMessage && <div className="success-msg">{queueActionMessage}</div>}

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
              <div className="list-card-actions proxy-card-actions">
                <Link to={`/proxies/${row.sourceType}/${row.id}`} className="btn btn-sm btn-primary">Print Queue</Link>
                <Link to={row.editTo} className="btn btn-sm btn-ghost">Edit</Link>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => void clearQueueForSource(row.sourceType, row.id)}
                  disabled={queueActionLoading}
                >
                  Clear Queue
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
