import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollections } from '../../hooks/useFirestore';

type TradeEntry = {
  id: string;
  name: string;
  set_name: string;
  imageUri: string;
  ownedQty: number;
  marketPrice: number;
  ownedValue: number;
  tradeQty: number;
  isDuplicate: boolean;
  tradeability: 'Low' | 'Medium' | 'High';
  tags: string[];
};

export default function TradeBinderPage() {
  const { user } = useAuth();
  const { collections, loading } = useCollections(user?.uid ?? null);
  const [searchText, setSearchText] = useState('');
  const [mode, setMode] = useState<'all' | 'dupes' | 'tradeable'>('all');

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
            marketPrice: 0,
            ownedValue: 0,
            tradeQty: 0,
            isDuplicate: false,
            tradeability: 'Low',
            tags: [],
          };
        }

        byCard[key].ownedQty += card.quantity;
        const parsedPrice = parseFloat(card.price ?? '0') || 0;
        byCard[key].marketPrice = Math.max(byCard[key].marketPrice, parsedPrice);
      }
    }

    const entries = Object.values(byCard)
      .map((entry) => ({
        ...entry,
        ownedValue: entry.marketPrice * entry.ownedQty,
        tradeQty: Math.max(0, entry.ownedQty - 1),
        isDuplicate: entry.ownedQty > 1,
      }))
      .map((entry) => {
        const tags: string[] = [];
        if (entry.isDuplicate) tags.push('Duplicate');
        if (entry.marketPrice >= 25) tags.push('Premium');
        else if (entry.marketPrice >= 8) tags.push('Staple');
        else tags.push('Budget');

        let tradeability: TradeEntry['tradeability'] = 'Low';
        if (entry.isDuplicate && entry.marketPrice >= 8) {
          tradeability = 'High';
        } else if (entry.isDuplicate || entry.marketPrice >= 20) {
          tradeability = 'Medium';
        }

        return {
          ...entry,
          tradeability,
          tags,
        };
      })
      .sort((a, b) => b.ownedValue - a.ownedValue || a.name.localeCompare(b.name));

    return entries;
  }, [collections]);

  const filteredEntries = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return tradeEntries.filter((entry) => {
      if (mode === 'dupes' && !entry.isDuplicate) return false;
      if (mode === 'tradeable' && entry.tradeability === 'Low') return false;
      if (!text) return true;
      return entry.name.toLowerCase().includes(text) || entry.set_name.toLowerCase().includes(text);
    });
  }, [mode, searchText, tradeEntries]);

  const totalOwned = tradeEntries.reduce((sum, entry) => sum + entry.ownedQty, 0);
  const totalTrade = tradeEntries.reduce((sum, entry) => sum + entry.tradeQty, 0);
  const totalValue = tradeEntries.reduce((sum, entry) => sum + entry.ownedValue, 0);
  const duplicateCount = tradeEntries.filter((entry) => entry.isDuplicate).length;

  return (
    <div className="page">
      <h2 className="page-title">Trade <span className="accent-cyan">Binder</span></h2>
      <div className="trade-summary card-surface">
        <span>{tradeEntries.length} total cards</span>
        <span>{duplicateCount} duplicate-ready</span>
        <span>Total owned qty: {totalOwned}</span>
        <span>Available to trade: {totalTrade}</span>
        <span>Binder value: ${totalValue.toFixed(2)}</span>
      </div>

      <div className="trade-toolbar card-surface">
        <input
          type="text"
          placeholder="Search card or set…"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <div className="trade-filter-group">
          <button
            type="button"
            className={`collections-filter-toggle ${mode === 'all' ? 'active' : ''}`}
            onClick={() => setMode('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`collections-filter-toggle ${mode === 'dupes' ? 'active' : ''}`}
            onClick={() => setMode('dupes')}
          >
            Duplicates
          </button>
          <button
            type="button"
            className={`collections-filter-toggle ${mode === 'tradeable' ? 'active' : ''}`}
            onClick={() => setMode('tradeable')}
          >
            Tradeable
          </button>
        </div>
      </div>

      {loading && <p>Loading…</p>}

      {!loading && filteredEntries.length === 0 && (
        <div className="card-surface trade-empty">
          <p className="muted">No cards match this filter yet. Try changing filter mode or adding more cards to collections.</p>
        </div>
      )}

      {filteredEntries.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Card</th>
                <th>Set</th>
                <th>Owned</th>
                <th>Price</th>
                <th>Owned Value</th>
                <th>Trade Qty</th>
                <th>Tradeability</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Card">
                    {entry.imageUri && <img src={entry.imageUri} alt={entry.name} className="table-card-img" />}
                  </td>
                  <td data-label="Name">{entry.name}</td>
                  <td data-label="Set">{entry.set_name}</td>
                  <td data-label="Owned">{entry.ownedQty}</td>
                  <td data-label="Price">${entry.marketPrice.toFixed(2)}</td>
                  <td data-label="Owned Value">${entry.ownedValue.toFixed(2)}</td>
                  <td data-label="Trade Qty"><strong className="accent-cyan">{entry.tradeQty}</strong></td>
                  <td data-label="Tradeability">
                    <span className={`tradeability tradeability-${entry.tradeability.toLowerCase()}`}>
                      {entry.tradeability}
                    </span>
                  </td>
                  <td data-label="Tags">
                    <div className="trade-tag-list">
                      {entry.tags.map((tag) => (
                        <span
                          key={`${entry.id}-${tag}`}
                          className={`trade-tag ${tag === 'Duplicate' ? 'is-duplicate' : ''}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
