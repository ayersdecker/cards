import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDecks } from '../../hooks/useFirestore';
import { searchCards, getCardImage, getSimilarCards } from '../../services/scryfall';
import { exportDeck } from '../../services/excel';
import type { ScryfallCard, DeckCard } from '../../types';

const COLOR_DISPLAY: Record<string, { label: string; color: string }> = {
  W: { label: 'White', color: '#f9fafb' },
  U: { label: 'Blue', color: '#3b82f6' },
  B: { label: 'Black', color: '#6b21a8' },
  R: { label: 'Red', color: '#ef4444' },
  G: { label: 'Green', color: '#22c55e' },
};

export default function DeckBuilder() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { decks, updateDeck } = useDecks(user?.uid ?? null);
  const deck = decks.find((d) => d.id === id);

  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [hotswapCard, setHotswapCard] = useState<DeckCard | null>(null);
  const [hotswapOptions, setHotswapOptions] = useState<ScryfallCard[]>([]);
  const [loadingHotswap, setLoadingHotswap] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'side'>('main');

  if (!deck) return <div className="page"><p>Deck not found.</p></div>;

  const mainCards = deck.cards.filter((c) => !c.isSideboard);
  const sideCards = deck.cards.filter((c) => c.isSideboard);
  const mainCount = mainCards.reduce((s, c) => s + c.quantity, 0);
  const sideCount = sideCards.reduce((s, c) => s + c.quantity, 0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await searchCards(searchQ.trim());
      setSearchResults(res.data.slice(0, 12));
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const addCard = async (card: ScryfallCard, isSideboard = false) => {
    const existing = deck.cards.find(
      (c) => c.scryfallId === card.id && c.isSideboard === isSideboard
    );
    let updatedCards;
    if (existing) {
      updatedCards = deck.cards.map((c) =>
        c.scryfallId === card.id && c.isSideboard === isSideboard
          ? { ...c, quantity: c.quantity + 1 }
          : c
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
        isSideboard,
      };
      updatedCards = [...deck.cards, newCard];
    }
    await updateDeck(deck.id, { cards: updatedCards });
  };

  const removeCard = async (scryfallId: string, isSideboard: boolean) => {
    const updated = deck.cards.filter(
      (c) => !(c.scryfallId === scryfallId && c.isSideboard === isSideboard)
    );
    await updateDeck(deck.id, { cards: updated });
  };

  const changeQty = async (scryfallId: string, isSideboard: boolean, delta: number) => {
    const card = deck.cards.find(
      (c) => c.scryfallId === scryfallId && c.isSideboard === isSideboard
    );
    if (!card) return;
    const newQty = card.quantity + delta;
    if (newQty <= 0) {
      await removeCard(scryfallId, isSideboard);
    } else {
      const updated = deck.cards.map((c) =>
        c.scryfallId === scryfallId && c.isSideboard === isSideboard
          ? { ...c, quantity: newQty }
          : c
      );
      await updateDeck(deck.id, { cards: updated });
    }
  };

  const openHotswap = async (card: DeckCard) => {
    setHotswapCard(card);
    setLoadingHotswap(true);
    setHotswapOptions([]);
    const fakeCard = {
      id: card.scryfallId,
      name: card.name,
      colors: card.colors,
      color_identity: card.colors,
      cmc: card.cmc,
    } as ScryfallCard;
    const opts = await getSimilarCards(fakeCard);
    setHotswapOptions(opts);
    setLoadingHotswap(false);
  };

  const doHotswap = async (replacement: ScryfallCard) => {
    if (!hotswapCard) return;
    const updated = deck.cards.map((c) =>
      c.scryfallId === hotswapCard.scryfallId && c.isSideboard === hotswapCard.isSideboard
        ? {
            ...c,
            scryfallId: replacement.id,
            name: replacement.name,
            set_name: replacement.set_name,
            price: replacement.prices.usd,
            colors: replacement.colors ?? [],
            imageUri: getCardImage(replacement),
            cmc: replacement.cmc,
            type_line: replacement.type_line,
            mana_cost: replacement.mana_cost,
          }
        : c
    );
    await updateDeck(deck.id, { cards: updated });
    setHotswapCard(null);
    setHotswapOptions([]);
  };

  // Mana curve: group main cards by cmc
  const curveBuckets: Record<number, number> = {};
  for (const c of mainCards) {
    const bucket = Math.min(c.cmc, 7);
    curveBuckets[bucket] = (curveBuckets[bucket] ?? 0) + c.quantity;
  }
  const maxBucket = Math.max(...Object.values(curveBuckets), 1);

  // Color distribution
  const colorCounts: Record<string, number> = {};
  for (const c of mainCards) {
    for (const col of c.colors) {
      colorCounts[col] = (colorCounts[col] ?? 0) + c.quantity;
    }
  }

  const displayCards = activeTab === 'main' ? mainCards : sideCards;

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/decks" className="back-link">← Decks</Link>
        <h2 className="page-title">{deck.name}</h2>
        <button className="btn btn-primary" onClick={() => exportDeck(deck)}>Export XLSX</button>
      </div>

      <div className="deck-layout">
        <div className="deck-main-col">
          {/* Tabs */}
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              Main ({mainCount}/60)
            </button>
            <button
              className={`tab-btn ${activeTab === 'side' ? 'active' : ''}`}
              onClick={() => setActiveTab('side')}
            >
              Sideboard ({sideCount}/15)
            </button>
          </div>

          {/* Card list */}
          <div className="deck-card-list">
            {displayCards.map((c) => (
              <div key={`${c.scryfallId}-${c.isSideboard}`} className="deck-card-row">
                {c.imageUri && <img src={c.imageUri} alt={c.name} className="deck-row-img" />}
                <div className="deck-row-info">
                  <span className="deck-row-name">{c.name}</span>
                  <span className="deck-row-meta">{c.mana_cost} · {c.type_line}</span>
                </div>
                <div className="deck-row-controls">
                  <button className="qty-btn" onClick={() => changeQty(c.scryfallId, c.isSideboard, -1)}>−</button>
                  <span className="qty-val">{c.quantity}</span>
                  <button className="qty-btn" onClick={() => changeQty(c.scryfallId, c.isSideboard, 1)}>+</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => openHotswap(c)} title="Hotswap">⇄</button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeCard(c.scryfallId, c.isSideboard)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Search to add */}
          <div className="deck-search">
            <h4>Add Cards</h4>
            <form onSubmit={handleSearch} className="search-form">
              <input
                placeholder="Search to add…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={searching}>
                {searching ? '…' : 'Search'}
              </button>
            </form>
            {searchResults.length > 0 && (
              <div className="deck-search-results">
                {searchResults.map((card) => (
                  <div key={card.id} className="deck-search-row">
                    <span>{card.name}</span>
                    <div>
                      <button className="btn btn-sm btn-outline" onClick={() => addCard(card, false)}>+ Main</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => addCard(card, true)}>+ Side</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="deck-stats-col">
          <div className="stats-card">
            <h4>Mana Curve</h4>
            <div className="mana-curve">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((cmc) => (
                <div key={cmc} className="curve-col">
                  <div
                    className="curve-bar"
                    style={{ height: `${((curveBuckets[cmc] ?? 0) / maxBucket) * 100}%` }}
                    title={`${curveBuckets[cmc] ?? 0} cards`}
                  />
                  <div className="curve-label">{cmc === 7 ? '7+' : cmc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="stats-card">
            <h4>Color Distribution</h4>
            <div className="color-dist">
              {Object.entries(colorCounts).map(([col, count]) => (
                <div key={col} className="color-dist-row">
                  <span className="color-dot" style={{ background: COLOR_DISPLAY[col]?.color ?? '#888' }} />
                  <span>{COLOR_DISPLAY[col]?.label ?? col}</span>
                  <span className="color-count">{count}</span>
                </div>
              ))}
              {Object.keys(colorCounts).length === 0 && (
                <p className="muted">No colored cards yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hotswap modal */}
      {hotswapCard && (
        <div className="modal-overlay" onClick={() => setHotswapCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setHotswapCard(null)}>✕</button>
            <h3>Hotswap: <span className="accent-magenta">{hotswapCard.name}</span></h3>
            <p className="muted">Select a replacement card with similar color/cost:</p>
            {loadingHotswap && <p>Loading options…</p>}
            <div className="hotswap-options">
              {hotswapOptions.map((opt) => (
                <div key={opt.id} className="hotswap-option" onClick={() => doHotswap(opt)}>
                  {getCardImage(opt) && <img src={getCardImage(opt)} alt={opt.name} />}
                  <div>
                    <div>{opt.name}</div>
                    <div className="muted">{opt.mana_cost} · {opt.prices.usd ? `$${opt.prices.usd}` : 'N/A'}</div>
                  </div>
                </div>
              ))}
              {!loadingHotswap && hotswapOptions.length === 0 && <p>No similar cards found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
