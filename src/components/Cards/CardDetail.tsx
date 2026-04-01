import React, { useState } from 'react';
import type { ScryfallCard, CollectionCard, DeckCard } from '../../types';
import { getCardImage, mapColors } from '../../services/scryfall';
import { useAuth } from '../../context/AuthContext';
import { useCollections, useDecks } from '../../hooks/useFirestore';
import { useStorageSettings } from '../../context/StorageSettingsContext';
import { getStorageRec, getStorageTone } from '../../services/storageSettings';

interface Props {
  card: ScryfallCard;
  onClose: () => void;
}

export default function CardDetail({ card, onClose }: Props) {
  const { user } = useAuth();
  const { settings } = useStorageSettings();
  const { collections, updateCollection } = useCollections(user?.uid ?? null);
  const { decks, updateDeck } = useDecks(user?.uid ?? null);
  const [feedback, setFeedback] = useState('');

  const addToCollection = async (colId: string) => {
    const col = collections.find((c) => c.id === colId);
    if (!col) return;
    const existing = col.cards.find((c) => c.scryfallId === card.id);
    let updatedCards;
    if (existing) {
      updatedCards = col.cards.map((c) =>
        c.scryfallId === card.id ? { ...c, quantity: c.quantity + 1 } : c
      );
    } else {
      const newCard: CollectionCard = {
        scryfallId: card.id,
        name: card.name,
        set: card.set,
        set_name: card.set_name,
        price: card.prices.usd,
        colors: card.colors ?? [],
        imageUri: getCardImage(card),
        addedAt: Date.now(),
        quantity: 1,
        cmc: card.cmc,
        type_line: card.type_line,
        mana_cost: card.mana_cost,
      };
      updatedCards = [...col.cards, newCard];
    }
    await updateCollection(colId, { cards: updatedCards });
    setFeedback(`Added to "${col.name}"!`);
    setTimeout(() => setFeedback(''), 2000);
  };

  const addToDeck = async (deckId: string) => {
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) return;
    const existing = deck.cards.find((c) => c.scryfallId === card.id && !c.isSideboard);
    let updatedCards;
    if (existing) {
      updatedCards = deck.cards.map((c) =>
        c.scryfallId === card.id && !c.isSideboard ? { ...c, quantity: c.quantity + 1 } : c
      );
    } else {
      const newCard: DeckCard = {
        scryfallId: card.id,
        name: card.name,
        set_name: card.set_name,
        price: card.prices.usd,
        colors: card.colors ?? [],
        imageUri: getCardImage(card),
        quantity: 1,
        cmc: card.cmc,
        type_line: card.type_line,
        mana_cost: card.mana_cost,
        isSideboard: false,
      };
      updatedCards = [...deck.cards, newCard];
    }
    await updateDeck(deckId, { cards: updatedCards });
    setFeedback(`Added to "${deck.name}"!`);
    setTimeout(() => setFeedback(''), 2000);
  };

  const storageRec = getStorageRec(
    {
      price: card.prices.usd,
      name: card.name,
      set: card.set,
      set_name: card.set_name,
      colors: card.colors ?? [],
      cmc: card.cmc,
      type_line: card.type_line,
      mana_cost: card.mana_cost,
    },
    settings
  );
  const storageTier = getStorageTone(
    {
      price: card.prices.usd,
      name: card.name,
      set: card.set,
      set_name: card.set_name,
      colors: card.colors ?? [],
      cmc: card.cmc,
      type_line: card.type_line,
      mana_cost: card.mana_cost,
    },
    settings
  );
  const storageClass =
    storageTier === 'high' ? 'accent-yellow' : storageTier === 'mid' ? 'accent-cyan' : 'accent-magenta';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card-detail" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="card-detail-inner">
          <div className="card-detail-image">
            {getCardImage(card) && (
              <img src={getCardImage(card)} alt={card.name} />
            )}
          </div>
          <div className="card-detail-info">
            <h2>{card.name}</h2>
            <p className="card-type">{card.type_line}</p>
            {card.mana_cost && <p className="card-mana">Mana: <strong>{card.mana_cost}</strong></p>}
            {card.oracle_text && <p className="card-oracle">{card.oracle_text}</p>}
            <div className="card-meta">
              <span>Set: <strong>{card.set_name}</strong></span>
              <span>Colors: <strong>{mapColors(card.colors ?? [])}</strong></span>
              <span>Price: <strong className="accent-yellow">{card.prices.usd ? `$${card.prices.usd}` : 'N/A'}</strong></span>
              <span>Storage: <strong className={storageClass}>{storageRec}</strong></span>
            </div>
            {feedback && <div className="success-msg">{feedback}</div>}
            {collections.length > 0 && (
              <div className="add-to-section">
                <h4>Add to Collection</h4>
                <div className="btn-group">
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      className="btn btn-sm btn-outline"
                      onClick={() => addToCollection(col.id)}
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {decks.length > 0 && (
              <div className="add-to-section">
                <h4>Add to Deck</h4>
                <div className="btn-group">
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      className="btn btn-sm btn-outline"
                      onClick={() => addToDeck(deck.id)}
                    >
                      {deck.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
