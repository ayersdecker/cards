import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollections } from '../../hooks/useFirestore';

type TradeEntry = {
  id: string;
  name: string;
  set_name: string;
  imageUri: string;
  ownedQty: number;
  tradeQty: number;
};

export default function TradeBinderPage() {
  const { user } = useAuth();
  const { collections, loading } = useCollections(user?.uid ?? null);

  const tradeEntries = useMemo<TradeEntry[]>(() => {
    const byCard: Record<string, TradeEntry> = {};

    for (const collection of collections) {
      for (const card of collection.cards) {
        const key = card.scryfallId;
        if (!byCard[key]) {
          byCard[key] = {
            id: key,
            name: card.name,
            set_name: card.set_name,
            imageUri: card.imageUri,
            ownedQty: 0,
            tradeQty: 0,
          };
        }
        byCard[key].ownedQty += card.quantity;
      }
    }

    const entries = Object.values(byCard)
      .map((entry) => ({
        ...entry,
        tradeQty: Math.max(0, entry.ownedQty - 1),
      }))
      .filter((entry) => entry.tradeQty > 0)
      .sort((a, b) => b.tradeQty - a.tradeQty || a.name.localeCompare(b.name));

    return entries;
  }, [collections]);

  const totalOwned = tradeEntries.reduce((sum, entry) => sum + entry.ownedQty, 0);
  const totalTrade = tradeEntries.reduce((sum, entry) => sum + entry.tradeQty, 0);

  return (
    <div className="page">
      <h2 className="page-title">Trade <span className="accent-cyan">Binder</span></h2>
      <div className="trade-summary card-surface">
        <span>{tradeEntries.length} tradeable cards</span>
        <span>Total owned qty: {totalOwned}</span>
        <span>Available to trade: {totalTrade}</span>
      </div>

      {loading && <p>Loading…</p>}

      {!loading && tradeEntries.length === 0 && (
        <div className="card-surface trade-empty">
          <p className="muted">No duplicates yet. Add more copies in your collections to populate your trade binder.</p>
        </div>
      )}

      {tradeEntries.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Card</th>
                <th>Set</th>
                <th>Owned</th>
                <th>Trade Qty</th>
              </tr>
            </thead>
            <tbody>
              {tradeEntries.map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Card">
                    {entry.imageUri && <img src={entry.imageUri} alt={entry.name} className="table-card-img" />}
                  </td>
                  <td data-label="Name">{entry.name}</td>
                  <td data-label="Set">{entry.set_name}</td>
                  <td data-label="Owned">{entry.ownedQty}</td>
                  <td data-label="Trade Qty"><strong className="accent-cyan">{entry.tradeQty}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
