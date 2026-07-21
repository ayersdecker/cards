import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDecks, useCollections } from '../../hooks/useFirestore';
import CardDetail from '../Cards/CardDetail';
import { searchCards, getCardByExactName, getCardById, getCardByName, getCardImage, getSimilarCards } from '../../services/scryfall';
import { resolveBulkCardList } from '../../services/bulkImport';
import { exportDeck } from '../../services/excel';
import type { ScryfallCard, DeckCard } from '../../types';
import { useStorageSettings } from '../../context/StorageSettingsContext';
import { chatWithDeckAssistant, optimizeDeck, type DeckAISuggestion } from '../../services/openai';

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
  const { settings } = useStorageSettings();
  const { decks, updateDeck } = useDecks(user?.uid ?? null);
  const { collections } = useCollections(user?.uid ?? null);
  const deck = decks.find((d) => d.id === id);

  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [hotswapCard, setHotswapCard] = useState<DeckCard | null>(null);
  const [hotswapOptions, setHotswapOptions] = useState<ScryfallCard[]>([]);
  const [loadingHotswap, setLoadingHotswap] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'side'>('main');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<DeckAISuggestion[]>([]);
  const [aiError, setAiError] = useState('');
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);
  const [deckRuleError, setDeckRuleError] = useState('');
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [selectedCardLoading, setSelectedCardLoading] = useState(false);
  const [selectedCardError, setSelectedCardError] = useState('');

  if (!deck) return <div className="page"><p>Deck not found.</p></div>;

  const mainCards = deck.cards.filter((c) => !c.isSideboard);
  const sideCards = deck.cards.filter((c) => c.isSideboard);
  const mainCount = mainCards.reduce((s, c) => s + c.quantity, 0);
  const sideCount = sideCards.reduce((s, c) => s + c.quantity, 0);
  const commanderTarget = deck.isCommander ? 100 : 60;
  const commanderCard = deck.commanderCardId
    ? deck.cards.find((card) => card.scryfallId === deck.commanderCardId && !card.isSideboard)
    : null;

  const collectionQtyById = collections.reduce((acc, collection) => {
    for (const card of collection.cards) {
      acc[card.scryfallId] = (acc[card.scryfallId] ?? 0) + card.quantity;
    }
    return acc;
  }, {} as Record<string, number>);

  const getCollectionQty = (scryfallId: string) => collectionQtyById[scryfallId] ?? 0;

  const getCheckedQty = (card: DeckCard) => {
    const checked = card.collectedQuantity ?? 0;
    return Math.max(0, Math.min(checked, card.quantity));
  };

  const getOwnedQty = (card: DeckCard) => Math.max(getCollectionQty(card.scryfallId), getCheckedQty(card));
  const getMissingQty = (card: DeckCard) => Math.max(0, card.quantity - getOwnedQty(card));

  const normalizeName = (name: string) => name.trim().toLowerCase();

  const getIdentityFromDeckCard = (card: DeckCard): string[] => {
    const source = card.colorIdentity && card.colorIdentity.length > 0 ? card.colorIdentity : card.colors;
    return source.map((color) => color.toUpperCase());
  };

  const getIdentityFromScryfall = (card: ScryfallCard): string[] => {
    const source = card.color_identity && card.color_identity.length > 0 ? card.color_identity : (card.colors ?? []);
    return source.map((color) => color.toUpperCase());
  };

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

  const addCard = async (card: ScryfallCard, isSideboard = false, quantity = 1) => {
    setDeckRuleError('');

    const normalizedQuantity = Math.max(1, quantity);
    const quantityToAdd = deck.isCommander ? 1 : normalizedQuantity;

    const existing = deck.cards.find(
      (c) => c.scryfallId === card.id && c.isSideboard === isSideboard
    );

    const duplicateByName = deck.cards.find(
      (c) => normalizeName(c.name) === normalizeName(card.name) && c.scryfallId !== card.id
    );

    if (deck.isCommander && duplicateByName) {
      setDeckRuleError(`Commander decks allow one copy of each card. ${card.name} already exists.`);
      return false;
    }

    if (deck.isCommander && commanderCard && card.id !== commanderCard.scryfallId) {
      const commanderIdentity = getIdentityFromDeckCard(commanderCard);
      const candidateIdentity = getIdentityFromScryfall(card);
      const outsideColorIdentity = candidateIdentity.some((color) => !commanderIdentity.includes(color));
      if (outsideColorIdentity) {
        setDeckRuleError(`${card.name} is outside your commander's color identity.`);
        return false;
      }
    }

    let updatedCards;
    if (existing) {
      if (deck.isCommander) {
        setDeckRuleError(`${card.name} is already in this Commander deck.`);
        return false;
      }

      updatedCards = deck.cards.map((c) =>
        c.scryfallId === card.id && c.isSideboard === isSideboard
          ? { ...c, quantity: c.quantity + quantityToAdd }
          : c
      );
    } else {
      const newCard: DeckCard = {
        scryfallId: card.id,
        name: card.name,
        set: card.set,
        set_name: card.set_name,
        price: card.prices.usd,
        colors: card.colors ?? [],
        colorIdentity: card.color_identity ?? card.colors ?? [],
        imageUri: getCardImage(card),
        quantity: quantityToAdd,
        cmc: card.cmc,
        type_line: card.type_line,
        mana_cost: card.mana_cost,
        isSideboard,
      };
      updatedCards = [...deck.cards, newCard];
    }
    await updateDeck(deck.id, { cards: updatedCards });
    return true;
  };

  const removeCard = async (scryfallId: string, isSideboard: boolean) => {
    const updated = deck.cards.filter(
      (c) => !(c.scryfallId === scryfallId && c.isSideboard === isSideboard)
    );
    const patch: Partial<typeof deck> = { cards: updated };
    if (deck.commanderCardId === scryfallId) {
      patch.commanderCardId = undefined;
    }
    await updateDeck(deck.id, patch);
  };

  const changeQty = async (scryfallId: string, isSideboard: boolean, delta: number) => {
    const card = deck.cards.find(
      (c) => c.scryfallId === scryfallId && c.isSideboard === isSideboard
    );
    if (!card) return;
    if (deck.isCommander && delta > 0) {
      setDeckRuleError('Commander decks are singleton. Quantities cannot exceed 1.');
      return;
    }
    const newQty = card.quantity + delta;
    if (newQty <= 0) {
      await removeCard(scryfallId, isSideboard);
    } else {
      const updated = deck.cards.map((c) =>
        c.scryfallId === scryfallId && c.isSideboard === isSideboard
          ? {
              ...c,
              quantity: newQty,
              collectedQuantity: Math.min(getCheckedQty(c), newQty),
              proxyQueuedQuantity: Math.min(c.proxyQueuedQuantity ?? 0, Math.max(0, newQty - getOwnedQty(c))),
            }
          : c
      );
      await updateDeck(deck.id, { cards: updated });
    }
  };

  const setCollectedQuantity = async (card: DeckCard, nextValue: number) => {
    const nextCollected = Math.max(0, Math.min(nextValue, card.quantity));
    const updated = deck.cards.map((entry) => {
      if (entry.scryfallId !== card.scryfallId || entry.isSideboard !== card.isSideboard) {
        return entry;
      }

      const nextOwned = Math.max(getCollectionQty(entry.scryfallId), nextCollected);
      const nextMissing = Math.max(0, entry.quantity - nextOwned);

      return {
        ...entry,
        collectedQuantity: nextCollected,
        proxyQueuedQuantity: Math.min(entry.proxyQueuedQuantity ?? 0, nextMissing),
      };
    });

    await updateDeck(deck.id, { cards: updated });
  };

  const setProxyQueuedQuantity = async (card: DeckCard, nextValue: number) => {
    const nextQueued = Math.max(0, Math.min(nextValue, getMissingQty(card)));
    const updated = deck.cards.map((entry) =>
      entry.scryfallId === card.scryfallId && entry.isSideboard === card.isSideboard
        ? { ...entry, proxyQueuedQuantity: nextQueued }
        : entry
    );
    await updateDeck(deck.id, { cards: updated });
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

  const openCardDetail = async (card: DeckCard) => {
    setSelectedCardError('');
    setSelectedCardLoading(true);
    const detailedCard = await getCardById(card.scryfallId);
    if (detailedCard) {
      setSelectedCard(detailedCard);
    } else {
      setSelectedCardError('Card details are unavailable for this entry.');
      setSelectedCard(null);
    }
    setSelectedCardLoading(false);
  };

  const doHotswap = async (replacement: ScryfallCard) => {
    if (!hotswapCard) return;

    if (deck.isCommander) {
      const duplicateByName = deck.cards.find(
        (card) =>
          normalizeName(card.name) === normalizeName(replacement.name) &&
          card.scryfallId !== hotswapCard.scryfallId
      );
      if (duplicateByName) {
        setDeckRuleError(`Commander decks allow one copy of each card. ${replacement.name} already exists.`);
        return;
      }

      if (commanderCard && hotswapCard.scryfallId !== commanderCard.scryfallId) {
        const commanderIdentity = getIdentityFromDeckCard(commanderCard);
        const candidateIdentity = getIdentityFromScryfall(replacement);
        const outsideColorIdentity = candidateIdentity.some((color) => !commanderIdentity.includes(color));
        if (outsideColorIdentity) {
          setDeckRuleError(`${replacement.name} is outside your commander's color identity.`);
          return;
        }
      }
    }

    const updated = deck.cards.map((c) =>
      c.scryfallId === hotswapCard.scryfallId && c.isSideboard === hotswapCard.isSideboard
        ? {
            ...c,
            scryfallId: replacement.id,
            name: replacement.name,
            set: replacement.set,
            set_name: replacement.set_name,
            price: replacement.prices.usd,
            colors: replacement.colors ?? [],
            colorIdentity: replacement.color_identity ?? replacement.colors ?? [],
            imageUri: getCardImage(replacement),
            cmc: replacement.cmc,
            type_line: replacement.type_line,
            mana_cost: replacement.mana_cost,
            quantity: deck.isCommander ? 1 : c.quantity,
          }
        : c
    );
    await updateDeck(deck.id, { cards: updated });
    setHotswapCard(null);
    setHotswapOptions([]);
  };

  const handleBulkImport = async () => {
    if (!bulkInput.trim()) return;

    setBulkLoading(true);
    setBulkError('');
    setBulkMessage('');

    try {
      const { resolved, missing } = await resolveBulkCardList(bulkInput, {
        preferredSetCode: settings.preferredSetCode,
      });

      if (resolved.length === 0) {
        setBulkError(missing.length > 0 ? `No cards were imported. Missing: ${missing.join(', ')}` : 'No valid card entries found.');
        return;
      }

      const targetSideboard = activeTab === 'side';
      const nextCards = [...deck.cards];

      for (const entry of resolved) {
        const duplicateByName = nextCards.find(
          (card) => normalizeName(card.name) === normalizeName(entry.card.name)
        );

        if (deck.isCommander && duplicateByName) {
          continue;
        }

        if (deck.isCommander && commanderCard && entry.card.id !== commanderCard.scryfallId) {
          const commanderIdentity = getIdentityFromDeckCard(commanderCard);
          const candidateIdentity = getIdentityFromScryfall(entry.card);
          const outsideColorIdentity = candidateIdentity.some((color) => !commanderIdentity.includes(color));
          if (outsideColorIdentity) {
            continue;
          }
        }

        const existing = nextCards.find(
          (card) => card.scryfallId === entry.card.id && card.isSideboard === targetSideboard
        );

        if (existing) {
          if (!deck.isCommander) {
            existing.quantity += entry.quantity;
          }
        } else {
          nextCards.push({
            scryfallId: entry.card.id,
            name: entry.card.name,
            set: entry.card.set,
            set_name: entry.card.set_name,
            price: entry.card.prices.usd,
            colors: entry.card.colors ?? [],
            colorIdentity: entry.card.color_identity ?? entry.card.colors ?? [],
            imageUri: getCardImage(entry.card),
            quantity: deck.isCommander ? 1 : entry.quantity,
            cmc: entry.card.cmc,
            type_line: entry.card.type_line,
            mana_cost: entry.card.mana_cost,
            isSideboard: targetSideboard,
          });
        }
      }

      await updateDeck(deck.id, { cards: nextCards });
      setBulkInput('');
      setBulkMessage(
        missing.length > 0
          ? `Imported ${resolved.length} card names to ${targetSideboard ? 'sideboard' : 'main deck'}. Missing: ${missing.join(', ')}`
          : `Imported ${resolved.length} card names to ${targetSideboard ? 'sideboard' : 'main deck'}.`
      );
    } catch (error: unknown) {
      setBulkError(error instanceof Error ? error.message : 'Bulk import failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    if (deck.cards.length === 0) return;

    setRefreshLoading(true);
    setRefreshMessage('');
    setRefreshError('');

    try {
      let refreshedCount = 0;
      let missingCount = 0;

      const refreshedCards = await Promise.all(
        deck.cards.map(async (card) => {
          const latest = await getCardById(card.scryfallId);
          if (!latest) {
            missingCount += 1;
            return card;
          }

          refreshedCount += 1;
          return {
            ...card,
            name: latest.name,
            set: latest.set,
            set_name: latest.set_name,
            price: latest.prices.usd,
            colors: latest.colors ?? [],
            colorIdentity: latest.color_identity ?? latest.colors ?? [],
            imageUri: getCardImage(latest) || card.imageUri,
            cmc: latest.cmc,
            type_line: latest.type_line,
            mana_cost: latest.mana_cost,
          };
        })
      );

      await updateDeck(deck.id, { cards: refreshedCards });
      setRefreshMessage(
        missingCount > 0
          ? `Updated ${refreshedCount} card prices. ${missingCount} cards could not be refreshed.`
          : `Updated ${refreshedCount} card prices.`
      );
    } catch (error: unknown) {
      setRefreshError(error instanceof Error ? error.message : 'Price refresh failed');
    } finally {
      setRefreshLoading(false);
    }
  };

  const setCommanderMode = async (nextValue: boolean) => {
    const patch: Partial<typeof deck> = { isCommander: nextValue };
    if (!nextValue) {
      patch.commanderCardId = undefined;
    }
    await updateDeck(deck.id, patch);
    setDeckRuleError('');
  };

  const markAsCommander = async (card: DeckCard) => {
    if (card.isSideboard) return;
    await updateDeck(deck.id, { commanderCardId: card.scryfallId, isCommander: true });
    setDeckRuleError('');
  };

  const deckForAI = {
    name: deck.name,
    isCommander: deck.isCommander,
    cards: deck.cards.map((card) => ({
      name: card.name,
      quantity: card.quantity,
      isSideboard: card.isSideboard,
      type_line: card.type_line,
      mana_cost: card.mana_cost,
      cmc: card.cmc,
      colors: card.colors,
    })),
  };

  const runOptimize = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const result = await optimizeDeck(deckForAI);
      setAiReply(result.reply);
      setAiSuggestions(result.suggestions);
    } catch (error: unknown) {
      setAiError(error instanceof Error ? error.message : 'AI optimization failed');
    } finally {
      setAiLoading(false);
    }
  };

  const runChat = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const result = await chatWithDeckAssistant(deckForAI, aiPrompt.trim());
      setAiReply(result.reply);
      setAiSuggestions(result.suggestions);
      setAiPrompt('');
    } catch (error: unknown) {
      setAiError(error instanceof Error ? error.message : 'AI chat failed');
    } finally {
      setAiLoading(false);
    }
  };

  const quickAddSuggestion = async (suggestion: DeckAISuggestion, index: number) => {
    const key = `${suggestion.name}-${index}`;
    setAddingSuggestion(key);
    setAiError('');
    try {
      const preferredSet = settings.preferredSetCode?.trim().toLowerCase();
      const resolved =
        (preferredSet ? await getCardByExactName(suggestion.name, preferredSet) : null) ??
        (await getCardByExactName(suggestion.name)) ??
        (await getCardByName(suggestion.name));

      if (!resolved) {
        setAiError(`Could not find "${suggestion.name}" on Scryfall.`);
        return;
      }

      const targetSide = suggestion.section === 'side';
      const quantity = Math.max(1, Math.min(suggestion.quantity ?? 1, deck.isCommander ? 1 : 4));
      await addCard(resolved, targetSide, quantity);
    } catch (error: unknown) {
      setAiError(error instanceof Error ? error.message : 'Failed to add suggested card');
    } finally {
      setAddingSuggestion(null);
    }
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
  const queuedProxyCount = deck.cards.reduce((sum, card) => sum + (card.proxyQueuedQuantity ?? 0), 0);
  const queuedProxyRows = deck.cards
    .filter((card) => (card.proxyQueuedQuantity ?? 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/collections" className="back-link">← Collections</Link>
        <h2 className="page-title">{deck.name}</h2>
        <div className="deck-format-toggle" role="group" aria-label="Deck format">
          <button
            type="button"
            className={`deck-format-btn ${!deck.isCommander ? 'active' : ''}`}
            onClick={() => void setCommanderMode(false)}
          >
            Standard
          </button>
          <button
            type="button"
            className={`deck-format-btn ${deck.isCommander ? 'active' : ''}`}
            onClick={() => void setCommanderMode(true)}
          >
            Commander
          </button>
        </div>
        <button className="btn btn-ghost" onClick={handleRefreshPrices} disabled={refreshLoading || deck.cards.length === 0}>
          {refreshLoading ? 'Refreshing…' : 'Refresh Prices'}
        </button>
        <button className="btn btn-primary" onClick={() => void exportDeck(deck, settings)}>Export XLSX</button>
        <Link className="btn btn-outline" to={`/proxies/deck/${deck.id}`}>Proxy Print ({queuedProxyCount})</Link>
      </div>
      {deck.isCommander && <p className="muted">Commander mode on. Suggested target: 100 cards total and singleton-friendly adds.</p>}
      {deck.isCommander && !commanderCard && (
        <div className="error-msg">Pick one main-deck card as your commander to enforce color identity.</div>
      )}
      {deckRuleError && <div className="error-msg">{deckRuleError}</div>}
      {refreshMessage && <div className="success-msg">{refreshMessage}</div>}
      {refreshError && <div className="error-msg">{refreshError}</div>}

      <div className="deck-layout">
        <div className="deck-main-col">
          {/* Tabs */}
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              Main ({mainCount}/{deck.isCommander ? commanderTarget : 60})
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
            {displayCards.map((c) => {
              const collectionQty = getCollectionQty(c.scryfallId);
              const checkedQty = getCheckedQty(c);
              const ownedQty = getOwnedQty(c);
              const missingQty = getMissingQty(c);
              const proxyQueued = Math.max(0, Math.min(c.proxyQueuedQuantity ?? 0, missingQty));

              return (
                <div
                  key={`${c.scryfallId}-${c.isSideboard}`}
                  className="deck-card-row"
                >
                  {c.imageUri && (
                    <button
                      type="button"
                      className="deck-row-image-button"
                      onClick={() => void openCardDetail(c)}
                      aria-label={`View details for ${c.name}`}
                    >
                      <img src={c.imageUri} alt={c.name} className="deck-row-img" />
                    </button>
                  )}
                  <div className="deck-row-info">
                    <span className="deck-row-name">
                      {c.name}
                      {deck.commanderCardId === c.scryfallId && <span className="commander-badge">Commander</span>}
                    </span>
                    <span className="deck-row-meta">{c.mana_cost} · {c.type_line}</span>
                    <div className="deck-row-collection">
                      <span className={`proxy-status-pill ${missingQty > 0 ? 'is-missing' : 'is-ready'}`}>
                        Owned {ownedQty}/{c.quantity}
                      </span>
                      <span className="muted">Collection: {collectionQty}</span>
                      <div className="deck-checkoff-control">
                        <span className="muted">Check Off</span>
                        <button className="qty-btn" onClick={() => void setCollectedQuantity(c, checkedQty - 1)}>−</button>
                        <span className="qty-val">{checkedQty}</span>
                        <button className="qty-btn" onClick={() => void setCollectedQuantity(c, checkedQty + 1)}>+</button>
                      </div>
                      <div className="proxy-qty-control">
                        <span className="muted">Proxy Queue</span>
                        <button
                          className="qty-btn"
                          onClick={() => void setProxyQueuedQuantity(c, proxyQueued - 1)}
                          disabled={proxyQueued === 0}
                        >
                          −
                        </button>
                        <span className="qty-val">{proxyQueued}</span>
                        <button
                          className="qty-btn"
                          onClick={() => void setProxyQueuedQuantity(c, proxyQueued + 1)}
                          disabled={proxyQueued >= missingQty}
                        >
                          +
                        </button>
                        <span className="muted">/ {missingQty} missing</span>
                      </div>
                      {missingQty === 0 && <span className="muted">Ready to play</span>}
                    </div>
                  </div>
                  <div className="deck-row-controls" onClick={(event) => event.stopPropagation()}>
                    <button className="qty-btn" onClick={() => void changeQty(c.scryfallId, c.isSideboard, -1)}>−</button>
                    <span className="qty-val">{c.quantity}</span>
                    <button className="qty-btn" onClick={() => void changeQty(c.scryfallId, c.isSideboard, 1)}>+</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => void openHotswap(c)} title="Hotswap">⇄</button>
                    {deck.isCommander && !c.isSideboard && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => void markAsCommander(c)}
                      >
                        {deck.commanderCardId === c.scryfallId ? 'Commander' : 'Set Cmdr'}
                      </button>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => void removeCard(c.scryfallId, c.isSideboard)}>✕</button>
                  </div>
                </div>
              );
            })}
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

          <div className="bulk-import-card">
            <div className="bulk-import-head">
              <div>
                <h4>Paste Card List</h4>
                <p className="muted">Imports into the current {activeTab === 'side' ? 'sideboard' : 'main deck'} tab. Use `[SET]` for specific printings.</p>
              </div>
              <button className="btn btn-primary" onClick={handleBulkImport} disabled={bulkLoading || !bulkInput.trim()}>
                {bulkLoading ? 'Importing…' : `Add to ${activeTab === 'side' ? 'Sideboard' : 'Main Deck'}`}
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
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="deck-stats-col">
          <div className="stats-card">
            <h4>Proxy Queue</h4>
            <div className="proxy-sidebar-head">
              <span className="muted">Queued cards: {queuedProxyCount}</span>
              <Link to={`/proxies/deck/${deck.id}`} className="btn btn-sm btn-primary">Print</Link>
            </div>
            <div className="proxy-sidebar-list">
              {queuedProxyRows.map((card) => (
                <div key={`${card.scryfallId}-${card.isSideboard ? 'side' : 'main'}`} className="proxy-sidebar-row">
                  <span>{card.name}</span>
                  <span className="proxy-sidebar-qty">x{card.proxyQueuedQuantity}</span>
                </div>
              ))}
              {queuedProxyRows.length === 0 && (
                <p className="muted">No cards queued yet. Queue missing cards from the deck list.</p>
              )}
            </div>
          </div>

          <div className="stats-card">
            <h4>AI Deck Assistant</h4>
            <div className="ai-actions-row">
              <button className="btn btn-primary" onClick={runOptimize} disabled={aiLoading}>
                {aiLoading ? 'Thinking…' : deck.isCommander ? 'Optimize Commander' : 'Optimize Deck'}
              </button>
            </div>
            <div className="ai-chat-input-row">
              <input
                placeholder="Ask AI (e.g. add more ramp, fix curve, suggest removal)"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button className="btn btn-outline" onClick={runChat} disabled={aiLoading || !aiPrompt.trim()}>
                Send
              </button>
            </div>
            {aiError && <div className="error-msg">{aiError}</div>}
            {aiReply && <p className="muted ai-reply">{aiReply}</p>}
            {aiSuggestions.length > 0 && (
              <div className="ai-suggestions">
                {aiSuggestions.map((suggestion, index) => {
                  const suggestionKey = `${suggestion.name}-${index}`;
                  return (
                    <div key={suggestionKey} className="ai-suggestion-row">
                      <div>
                        <strong>{suggestion.name}</strong>
                        <div className="muted">{suggestion.reason}</div>
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => void quickAddSuggestion(suggestion, index)}
                        disabled={addingSuggestion === suggestionKey}
                      >
                        {addingSuggestion === suggestionKey ? 'Adding…' : `Quick Add ${suggestion.quantity ?? 1}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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

      {selectedCardLoading && (
        <div className="modal-overlay" onClick={() => setSelectedCardLoading(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCardLoading(false)}>✕</button>
            <p>Loading card details…</p>
          </div>
        </div>
      )}

      {selectedCardError && !selectedCardLoading && (
        <div className="modal-overlay" onClick={() => setSelectedCardError('')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCardError('')}>✕</button>
            <p>{selectedCardError}</p>
          </div>
        </div>
      )}

      {selectedCard && !selectedCardLoading && (
        <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
