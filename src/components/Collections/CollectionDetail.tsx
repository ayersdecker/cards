import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollections } from '../../hooks/useFirestore';
import { getCardImage, getStorageRec, mapColors } from '../../services/scryfall';
import { resolveBulkCardList } from '../../services/bulkImport';
import { exportCollection } from '../../services/excel';

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { collections, updateCollection } = useCollections(user?.uid ?? null);
  const col = collections.find((c) => c.id === id);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkError, setBulkError] = useState('');

  if (!col) return <div className="page"><p>Collection not found.</p></div>;

  const removeCard = async (scryfallId: string) => {
    const updated = col.cards.filter((c) => c.scryfallId !== scryfallId);
    await updateCollection(col.id, { cards: updated });
  };

  const changeQty = async (scryfallId: string, delta: number) => {
    const card = col.cards.find((entry) => entry.scryfallId === scryfallId);
    if (!card) return;

    const nextQuantity = card.quantity + delta;
    if (nextQuantity <= 0) {
      await removeCard(scryfallId);
      return;
    }

    const updated = col.cards.map((entry) =>
      entry.scryfallId === scryfallId ? { ...entry, quantity: nextQuantity } : entry
    );
    await updateCollection(col.id, { cards: updated });
  };

  const totalValue = col.cards
    .reduce((sum, c) => sum + (parseFloat(c.price ?? '0') || 0) * c.quantity, 0)
    .toFixed(2);

  const handleBulkImport = async () => {
    if (!bulkInput.trim()) return;

    setBulkLoading(true);
    setBulkError('');
    setBulkMessage('');

    try {
      const { resolved, missing } = await resolveBulkCardList(bulkInput);

      if (resolved.length === 0) {
        setBulkError(missing.length > 0 ? `No cards were imported. Missing: ${missing.join(', ')}` : 'No valid card entries found.');
        return;
      }

      const nextCards = [...col.cards];

      for (const entry of resolved) {
        const existing = nextCards.find((card) => card.scryfallId === entry.card.id);
        if (existing) {
          existing.quantity += entry.quantity;
        } else {
          nextCards.push({
            scryfallId: entry.card.id,
            name: entry.card.name,
            set_name: entry.card.set_name,
            price: entry.card.prices.usd,
            colors: entry.card.colors ?? [],
            imageUri: getCardImage(entry.card),
            addedAt: Date.now(),
            quantity: entry.quantity,
          });
        }
      }

      await updateCollection(col.id, { cards: nextCards });
      setBulkInput('');
      setBulkMessage(
        missing.length > 0
          ? `Imported ${resolved.length} card names. Missing: ${missing.join(', ')}`
          : `Imported ${resolved.length} card names.`
      );
    } catch (error: unknown) {
      setBulkError(error instanceof Error ? error.message : 'Bulk import failed');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/collections" className="back-link">← Collections</Link>
        <h2 className="page-title">{col.name}</h2>
        <button className="btn btn-primary" onClick={() => void exportCollection(col)}>
          Export XLSX
        </button>
      </div>
      <div className="collection-stats">
        <span>{col.cards.length} unique cards</span>
        <span>Total qty: {col.cards.reduce((s, c) => s + c.quantity, 0)}</span>
        <span>Est. Value: <strong className="accent-yellow">${totalValue}</strong></span>
      </div>
      <section className="bulk-import-card">
        <div className="bulk-import-head">
          <div>
            <h3>Paste Card List</h3>
            <p className="muted">Supports lines like `Lightning Bolt`, `4 Lightning Bolt`, or `Lightning Bolt x4`.</p>
          </div>
          <button className="btn btn-primary" onClick={handleBulkImport} disabled={bulkLoading || !bulkInput.trim()}>
            {bulkLoading ? 'Importing…' : 'Add to Collection'}
          </button>
        </div>
        <textarea
          className="bulk-import-input"
          placeholder={"4 Lightning Bolt\n2 Counterspell\nSol Ring x1"}
          value={bulkInput}
          onChange={(event) => setBulkInput(event.target.value)}
          rows={6}
        />
        {bulkMessage && <div className="success-msg">{bulkMessage}</div>}
        {bulkError && <div className="error-msg">{bulkError}</div>}
      </section>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Set</th>
              <th>Color</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Storage</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {col.cards.map((c) => (
              <tr key={c.scryfallId}>
                <td data-label="Card">
                  {c.imageUri && (
                    <img src={c.imageUri} alt={c.name} className="table-card-img" />
                  )}
                </td>
                <td data-label="Name">{c.name}</td>
                <td data-label="Set">{c.set_name}</td>
                <td data-label="Color">{mapColors(c.colors)}</td>
                <td data-label="Price" className="accent-yellow">{c.price ? `$${c.price}` : 'N/A'}</td>
                <td data-label="Qty">
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => changeQty(c.scryfallId, -1)} aria-label={`Decrease quantity for ${c.name}`}>−</button>
                    <span className="qty-val">{c.quantity}</span>
                    <button className="qty-btn" onClick={() => changeQty(c.scryfallId, 1)} aria-label={`Increase quantity for ${c.name}`}>+</button>
                  </div>
                </td>
                <td data-label="Storage">
                  <span className={`badge badge-${getStorageRec(c.price).toLowerCase()}`}>
                    {getStorageRec(c.price)}
                  </span>
                </td>
                <td data-label="Actions">
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => removeCard(c.scryfallId)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
