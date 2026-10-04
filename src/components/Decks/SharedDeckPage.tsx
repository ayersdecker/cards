import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { isSharedDeck } from '../../services/deckSharing';
import type { SharedDeck } from '../../types';
import DeckExportControls from './DeckExportControls';

export default function SharedDeckPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [deck, setDeck] = useState<SharedDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setDeck(null);
    setError('');
    setLoading(true);
    if (!shareId || !/^[A-Za-z0-9]{20}$/.test(shareId)) {
      setError('This share link is invalid.');
      setLoading(false);
      return;
    }
    return onSnapshot(doc(db, 'sharedDecks', shareId), (snapshot) => {
      const data: unknown = snapshot.data();
      if (snapshot.exists() && !isSharedDeck(data)) {
        setDeck(null);
        setError('This shared deck contains invalid data. Ask its owner to update the deck or create a new link.');
      } else {
        setDeck(isSharedDeck(data) ? data : null);
        setError('');
      }
      setLoading(false);
    }, (err) => {
      setDeck(null);
      setError(`Unable to load this shared deck: ${err.message}`);
      setLoading(false);
    });
  }, [shareId]);

  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const robots = existing ?? document.createElement('meta');
    const previousContent = robots.content;
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    if (!existing) document.head.appendChild(robots);
    return () => {
      if (existing) robots.content = previousContent;
      else robots.remove();
    };
  }, []);

  if (loading) return <div className="page"><p role="status">Loading shared deck...</p></div>;
  if (error) return <div className="page"><p className="error-msg" role="alert">{error}</p></div>;
  if (!deck) return <div className="page">
    <h1 className="page-title">Deck unavailable</h1>
    <p>This link may have been turned off, the deck deleted, or the link entered incorrectly.</p>
    <Link to="/guides">Explore deck-building guides</Link>
  </div>;

  const sections = [
    { name: 'Commander', cards: deck.cards.filter((card) => deck.isCommander && !card.isSideboard && card.scryfallId === deck.commanderCardId) },
    { name: 'Main deck', cards: deck.cards.filter((card) => !card.isSideboard && !(deck.isCommander && card.scryfallId === deck.commanderCardId)) },
    { name: 'Sideboard', cards: deck.cards.filter((card) => card.isSideboard) },
  ];

  return (
    <div className="page">
      <header className="info-page-header">
        <p className="info-page-kicker">SHARED DECK / READ ONLY</p>
        <h1 className="page-title">{deck.name}</h1>
        <p className="muted">{deck.isCommander ? 'Commander' : '60-card deck'} | {deck.cards.filter((card) => !card.isSideboard).reduce((sum, card) => sum + card.quantity, 0)} main-deck cards | Updated {new Date(deck.updatedAt).toLocaleString()}</p>
        <p>You're viewing a live decklist. No account is needed, and only the owner can edit it.</p>
      </header>
      {deck.cards.length === 0 && <p>This deck has no cards yet.</p>}
      {sections.map((section) => section.cards.length > 0 && <section key={section.name} className="shared-deck-section">
        <h2>{section.name} ({section.cards.reduce((sum, card) => sum + card.quantity, 0)})</h2>
        <div className="deck-card-list">
          {section.cards.map((card) => <div className="deck-card-row" key={`${card.scryfallId}-${card.isSideboard}`}>
            {card.imageUri && <img src={card.imageUri} alt={card.name} className="deck-row-img" loading="lazy" />}
            <span className="qty-val">{card.quantity}</span>
            <div className="deck-row-info">
              <Link to={`/search?q=${encodeURIComponent(card.name)}`} className="deck-row-name">{card.name}</Link>
              <span className="deck-row-meta">{card.mana_cost} | {card.type_line}</span>
            </div>
          </div>)}
        </div>
      </section>)}
      <DeckExportControls deck={deck} />
      <Link className="btn btn-outline" to="/guides">Learn to build your next deck</Link>
    </div>
  );
}
