import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollections } from '../../hooks/useFirestore';
import { getStorageRec, mapColors } from '../../services/scryfall';
import { exportCollection } from '../../services/excel';

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { collections, updateCollection } = useCollections(user?.uid ?? null);
  const col = collections.find((c) => c.id === id);

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
