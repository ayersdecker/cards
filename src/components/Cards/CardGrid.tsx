import React, { useState } from 'react';
import type { ScryfallCard } from '../../types';
import CardDetail from './CardDetail';
import { getCardImage } from '../../services/scryfall';

interface Props {
  cards: ScryfallCard[];
}

export default function CardGrid({ cards }: Props) {
  const [selected, setSelected] = useState<ScryfallCard | null>(null);

  if (cards.length === 0) return null;

  return (
    <>
      <div className="card-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className="card-thumb"
            onClick={() => setSelected(card)}
            title={card.name}
          >
            {getCardImage(card) ? (
              <img src={getCardImage(card)} alt={card.name} loading="lazy" />
            ) : (
              <div className="card-no-image">{card.name}</div>
            )}
            <div className="card-thumb-name">{card.name}</div>
            <div className="card-thumb-price">
              {card.prices.usd ? `$${card.prices.usd}` : 'N/A'}
            </div>
          </div>
        ))}
      </div>
      {selected && <CardDetail card={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
