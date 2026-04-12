import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDecks } from '../../hooks/useFirestore';
import { getCommanderByDayOffset, getTopCommanders } from '../../services/commanderOfDay';
import { getCardByName } from '../../services/scryfall';
import type { DeckCard, ScryfallCard } from '../../types';

const POPULAR_SEARCHES = [
  'Lightning Bolt',
  'Sol Ring',
  'Counterspell',
  'Swords to Plowshares',
  'Rhystic Study',
  'Cyclonic Rift',
];

const MTG_NEWS_LINKS = [
  {
    title: 'Magic News - Wizards of the Coast',
    url: 'https://magic.wizards.com/en/news',
    description: 'Official announcements, set previews, and product updates.',
  },
  {
    title: 'Wizards Announcements',
    url: 'https://magic.wizards.com/en/news/announcements',
    description: 'Official release notes, bans, and platform updates.',
  },
  {
    title: 'Wizards Event Locator',
    url: 'https://locator.wizards.com/',
    description: 'Find nearby stores and upcoming MTG events.',
  },
  {
    title: 'Tolarian Community College',
    url: 'https://www.youtube.com/@TolarianCommunityCollege',
    description: 'Deck techs, product reviews, and community commentary.',
  },
  {
    title: 'DailyMTG',
    url: 'https://magic.wizards.com/en/news/archive',
    description: 'Archived strategy pieces, set coverage, and feature articles.',
  },
  {
    title: 'MTG Banned and Restricted Announcements',
    url: 'https://magic.wizards.com/en/news/announcements?search=banned+and+restricted',
    description: 'Track format health updates and card legality changes.',
  },
  {
    title: 'Command Zone',
    url: 'https://www.youtube.com/@commandcast',
    description: 'Commander-focused gameplay, deck upgrades, and format trends.',
  },
  {
    title: 'MTGGoldfish',
    url: 'https://www.mtggoldfish.com/',
    description: 'Meta breakdowns, budget decklists, and finance snapshots.',
  },
];

const FEATURED_ARTICLES = [
  {
    title: 'Magic News Hub',
    description: 'Track set previews, product reveals, and official announcement posts.',
    url: 'https://magic.wizards.com/en/news',
    cardName: 'Chandra, Torch of Defiance',
  },
  {
    title: 'Tolarian Community College Videos',
    description: 'Watch deck analysis, product reviews, and gameplay advice from Prof.',
    url: 'https://www.youtube.com/@TolarianCommunityCollege',
    cardName: 'Kolaghan\'s Command',
  },
  {
    title: 'Wizards Announcements',
    description: 'Follow B&R updates, event policy changes, and platform rollout notes.',
    url: 'https://magic.wizards.com/en/news/announcements',
    cardName: 'Sorin, Imperious Bloodlord',
  },
  {
    title: 'MTGGoldfish Meta and Deck News',
    description: 'Browse current metagames, new decklists, and format movement.',
    url: 'https://www.mtggoldfish.com/metagame/standard',
    cardName: 'Jace, the Mind Sculptor',
  },
  {
    title: 'Commander Deckbuilding Coverage',
    description: 'Find commander deck upgrades, staples, and gameplay breakdowns.',
    url: 'https://www.youtube.com/@commandcast',
    cardName: 'Atraxa, Praetors\' Voice',
  },
];

type FeaturedSlide = {
  title: string;
  description: string;
  url: string;
  image: string;
};

function getArtCropUrl(card: {
  image_uris?: { art_crop?: string };
  card_faces?: Array<{ image_uris?: { art_crop?: string } }>;
}): string {
  return card.image_uris?.art_crop ?? card.card_faces?.[0]?.image_uris?.art_crop ?? '';
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { decks, createDeck, updateDeck } = useDecks(user?.uid ?? null);
  const [featuredSlides, setFeaturedSlides] = useState<FeaturedSlide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [topCommanders, setTopCommanders] = useState<ScryfallCard[]>([]);
  const [commanderLoading, setCommanderLoading] = useState(false);
  const [commanderError, setCommanderError] = useState('');
  const [selectedCommanderDeckId, setSelectedCommanderDeckId] = useState('');
  const [deckActionLoading, setDeckActionLoading] = useState(false);
  const [deckActionMessage, setDeckActionMessage] = useState('');
  const [deckActionError, setDeckActionError] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [guessLoading, setGuessLoading] = useState(false);
  const [guessFeedback, setGuessFeedback] = useState('');
  const [hintLevel, setHintLevel] = useState(1);

  useEffect(() => {
    let ignore = false;

    const loadSlides = async () => {
      const resolved = await Promise.all(
        FEATURED_ARTICLES.map(async (item) => {
          const card = await getCardByName(item.cardName);
          const image = card ? getArtCropUrl(card) : '';
          return {
            title: item.title,
            description: item.description,
            url: item.url,
            image,
          } as FeaturedSlide;
        })
      );

      if (ignore) return;
      setFeaturedSlides(resolved.filter((slide) => slide.image));
      setActiveSlide(0);
    };

    void loadSlides();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadCommanders = async () => {
      setCommanderLoading(true);
      setCommanderError('');

      try {
        const commanders = await getTopCommanders(300);
        if (ignore) return;
        setTopCommanders(commanders);
      } catch {
        if (ignore) return;
        setCommanderError('Could not load the top commander list right now.');
      } finally {
        if (!ignore) {
          setCommanderLoading(false);
        }
      }
    };

    void loadCommanders();

    return () => {
      ignore = true;
    };
  }, []);

  const commanderDecks = decks.filter((deck) => deck.isCommander);

  useEffect(() => {
    if (!selectedCommanderDeckId && commanderDecks.length > 0) {
      setSelectedCommanderDeckId(commanderDecks[0].id);
    }
  }, [commanderDecks, selectedCommanderDeckId]);

  const todayCommander = getCommanderByDayOffset(topCommanders, 0);
  const yesterdayCommander = getCommanderByDayOffset(topCommanders, -1);
  const tomorrowCommander = getCommanderByDayOffset(topCommanders, 1);

  const manaHint = tomorrowCommander?.mana_cost?.trim() || 'Unknown';
  const colorHint = tomorrowCommander && tomorrowCommander.color_identity.length > 0
    ? tomorrowCommander.color_identity.join(', ')
    : 'Colorless';
  const typeHint = tomorrowCommander?.type_line.split(' — ')[0] ?? 'Legendary';

  const hints = [
    `Mana Value: ${tomorrowCommander?.cmc ?? '?'}`,
    `Colors: ${colorHint}`,
    `Mana Cost: ${manaHint}`,
    `Card Type: ${typeHint}`,
  ];

  const getDeckCard = (card: ScryfallCard): DeckCard => ({
    scryfallId: card.id,
    name: card.name,
    set: card.set,
    set_name: card.set_name,
    price: card.prices.usd,
    colors: card.colors ?? [],
    colorIdentity: card.color_identity ?? card.colors ?? [],
    imageUri: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || getArtCropUrl(card),
    quantity: 1,
    cmc: card.cmc,
    type_line: card.type_line,
    mana_cost: card.mana_cost,
    isSideboard: false,
  });

  const handleCreateCommanderDeck = async () => {
    if (!user) {
      setDeckActionError('Sign in to create decks from Commander of the Day.');
      return;
    }

    if (!todayCommander) return;

    setDeckActionLoading(true);
    setDeckActionError('');
    setDeckActionMessage('');

    try {
      const deckId = await createDeck(`${todayCommander.name} Daily Commander`, { isCommander: true });
      if (!deckId) {
        throw new Error('Could not create deck.');
      }

      await updateDeck(deckId, {
        commanderCardId: todayCommander.id,
        cards: [getDeckCard(todayCommander)],
      });

      setDeckActionMessage('Commander deck created. Opening deck builder...');
      navigate(`/collections/deck/${deckId}`);
    } catch (error: unknown) {
      setDeckActionError(error instanceof Error ? error.message : 'Failed to create commander deck.');
    } finally {
      setDeckActionLoading(false);
    }
  };

  const handleAddToCommanderDeck = async () => {
    if (!todayCommander || !selectedCommanderDeckId) return;

    const selectedDeck = commanderDecks.find((deck) => deck.id === selectedCommanderDeckId);
    if (!selectedDeck) return;

    if (selectedDeck.commanderCardId && selectedDeck.commanderCardId !== todayCommander.id) {
      setDeckActionError('This deck already has a different commander set.');
      return;
    }

    setDeckActionLoading(true);
    setDeckActionError('');
    setDeckActionMessage('');

    try {
      const existingCard = selectedDeck.cards.find(
        (card) => card.scryfallId === todayCommander.id && !card.isSideboard
      );
      const nextCards = existingCard
        ? selectedDeck.cards
        : [...selectedDeck.cards, getDeckCard(todayCommander)];

      await updateDeck(selectedDeck.id, {
        commanderCardId: todayCommander.id,
        cards: nextCards,
      });
      setDeckActionMessage(`Added ${todayCommander.name} to ${selectedDeck.name}.`);
    } catch {
      setDeckActionError('Failed to add commander to deck.');
    } finally {
      setDeckActionLoading(false);
    }
  };

  const handleGuess = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!guessInput.trim() || !tomorrowCommander) return;

    setGuessLoading(true);
    setGuessFeedback('');

    try {
      const normalizedGuess = guessInput.trim().toLowerCase();
      const normalizedTarget = tomorrowCommander.name.trim().toLowerCase();

      if (normalizedGuess === normalizedTarget) {
        setGuessFeedback('Correct prediction. You guessed tomorrow\'s commander.');
        return;
      }

      const guessedCard = await getCardByName(guessInput.trim());
      if (!guessedCard) {
        setGuessFeedback('Not quite. Keep using hints and try another commander.');
        return;
      }

      const guessedColors = guessedCard.color_identity.join('');
      const targetColors = tomorrowCommander.color_identity.join('');
      const sameColors = guessedColors === targetColors;
      const cmcDelta = Math.abs(Math.round(guessedCard.cmc) - Math.round(tomorrowCommander.cmc));
      const typeMatch = guessedCard.type_line.split(' — ')[0] === tomorrowCommander.type_line.split(' — ')[0];

      const comparisons = [
        sameColors ? 'Color identity matches.' : 'Color identity is different.',
        cmcDelta === 0 ? 'Mana value is exact.' : `Mana value is off by ${cmcDelta}.`,
        typeMatch ? 'Primary type matches.' : 'Primary type differs.',
      ];

      setGuessFeedback(`Not tomorrow\'s pick. ${comparisons.join(' ')}`);
    } finally {
      setGuessLoading(false);
    }
  };

  useEffect(() => {
    if (featuredSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % featuredSlides.length);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [featuredSlides.length]);

  const currentSlide = featuredSlides[activeSlide] ?? null;

  return (
    <div className="page home-page">
      <section className="home-hero card-surface">
        <p className="home-kicker">Welcome to Redtail</p>
        <h1 className="home-title">Build better Magic collections and decks faster.</h1>
        <p className="home-subtitle">
          Magic: The Gathering is a strategy card game with over 30 years of cards,
          formats, and archetypes. Redtail helps you search cards, organize collections,
          and tune decklists in one place.
        </p>
        <div className="home-actions">
          <Link to="/search" className="btn btn-primary">Search Cards</Link>
          <Link to="/collections" className="btn btn-ghost">Open Collections</Link>
        </div>
      </section>

      <section className="home-grid">
        <article className="card-surface home-card">
          <h2>What is MTG?</h2>
          <p>
            MTG is a trading card game where you build a deck and duel opponents using spells,
            creatures, and strategic resource management.
          </p>
        </article>

        <article className="card-surface home-card">
          <h2>Core Formats</h2>
          <p>Popular formats include Standard, Commander, Modern, and Pioneer.</p>
          <p>Commander decks are singleton and built around a legendary commander.</p>
        </article>

        <article className="card-surface home-card">
          <h2>Popular Searches</h2>
          <div className="home-popular-list">
            {POPULAR_SEARCHES.map((name) => (
              <Link key={name} to={`/search?q=${encodeURIComponent(name)}`} className="home-chip">
                {name}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="card-surface commander-day-section">
        <div className="commander-day-head">
          <div>
            <p className="home-kicker">Shared Daily Event</p>
            <h2>Commander of the Day</h2>
            <p className="muted">
              Pulled from a rotating top 300 commander list and synced by UTC day so everyone sees the same card.
            </p>
          </div>
          <div className="commander-day-meta">
            <span>Pool Size: {topCommanders.length || '...'}</span>
            <span>Resets at 00:00 UTC</span>
          </div>
        </div>

        {commanderLoading && <p>Loading Commander of the Day…</p>}
        {commanderError && <p className="error-msg">{commanderError}</p>}

        {!commanderLoading && !commanderError && todayCommander && (
          <div className="commander-day-grid">
            <article className="commander-main-card">
              <div className="commander-main-image-wrap">
                <img
                  src={todayCommander.image_uris?.normal ?? todayCommander.card_faces?.[0]?.image_uris?.normal}
                  alt={todayCommander.name}
                  className="commander-main-image"
                />
              </div>
              <div className="commander-main-content">
                <h3>{todayCommander.name}</h3>
                <p className="muted">{todayCommander.type_line}</p>
                <div className="commander-pill-row">
                  <span className="commander-pill">Mana Cost: {todayCommander.mana_cost || 'Unknown'}</span>
                  <span className="commander-pill">Colors: {todayCommander.color_identity.join(', ') || 'Colorless'}</span>
                </div>
                <div className="commander-main-actions">
                  <Link
                    to={`/search?q=${encodeURIComponent(todayCommander.name)}`}
                    className="btn btn-ghost"
                  >
                    View Card Details
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void handleCreateCommanderDeck()}
                    disabled={deckActionLoading}
                  >
                    Create New Deck with Commander
                  </button>
                </div>
                {user && commanderDecks.length > 0 && (
                  <div className="commander-add-existing">
                    <select
                      value={selectedCommanderDeckId}
                      onChange={(event) => setSelectedCommanderDeckId(event.target.value)}
                      aria-label="Select commander deck"
                    >
                      {commanderDecks.map((deck) => (
                        <option key={deck.id} value={deck.id}>{deck.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => void handleAddToCommanderDeck()}
                      disabled={deckActionLoading || !selectedCommanderDeckId}
                    >
                      Add to Existing Commander Deck
                    </button>
                  </div>
                )}
                {!user && (
                  <p className="muted">Sign in to add today&apos;s commander directly into your decks.</p>
                )}
                {deckActionError && <p className="error-msg">{deckActionError}</p>}
                {deckActionMessage && <p className="success-msg">{deckActionMessage}</p>}
              </div>
            </article>

            <aside className="commander-side-panel">
              <div className="commander-side-block">
                <h4>Yesterday</h4>
                {yesterdayCommander ? (
                  <Link to={`/search?q=${encodeURIComponent(yesterdayCommander.name)}`} className="commander-side-link">
                    {yesterdayCommander.name}
                  </Link>
                ) : (
                  <p className="muted">No data</p>
                )}
              </div>

              <div className="commander-side-block">
                <h4>Guess Tomorrow&apos;s Commander</h4>
                <form onSubmit={handleGuess} className="commander-guess-form">
                  <input
                    value={guessInput}
                    onChange={(event) => setGuessInput(event.target.value)}
                    placeholder="Type a commander name"
                  />
                  <button type="submit" className="btn btn-primary" disabled={guessLoading}>
                    Check Guess
                  </button>
                </form>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setHintLevel((level) => Math.min(hints.length, level + 1))}
                  disabled={hintLevel >= hints.length}
                >
                  Reveal Another Hint
                </button>

                <div className="commander-hints">
                  {hints.slice(0, hintLevel).map((hint) => (
                    <p key={hint} className="commander-hint">{hint}</p>
                  ))}
                </div>

                {guessFeedback && <p className="success-msg">{guessFeedback}</p>}
                <p className="muted">Hints help narrow the field without revealing the name directly.</p>
              </div>
            </aside>
          </div>
        )}
      </section>

      <section className="card-surface home-news-section">
        <h2>Recent MTG News and Resources</h2>
        <p className="muted">Official sources from Wizards of the Coast and Magic channels.</p>

        <div className="home-news-content">
          {currentSlide && (
            <div className="home-featured-articles">
              <a
                href={currentSlide.url}
                target="_blank"
                rel="noreferrer"
                className="home-featured-card"
              >
                <img
                  key={currentSlide.image}
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="home-featured-image"
                />
                <div className="home-featured-body">
                  <h3>{currentSlide.title}</h3>
                  <p>{currentSlide.description}</p>
                </div>
              </a>
              <div className="home-slide-dots" aria-hidden="true">
                {featuredSlides.map((slide, index) => (
                  <span
                    key={`${slide.title}-${index}`}
                    className={`home-slide-dot ${index === activeSlide ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="home-news-list">
            {MTG_NEWS_LINKS.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="home-news-link"
              >
                <span className="home-news-title">{item.title}</span>
                <span className="home-news-desc">{item.description}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
