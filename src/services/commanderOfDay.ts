import type { ScryfallCard } from '../types';

const SCRYFALL_BASE = 'https://api.scryfall.com';
const COMMANDER_QUERY = 'is:commander game:paper legal:commander';
const CACHE_KEY = 'redtail.topCommanders.v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const DAY_MS = 1000 * 60 * 60 * 24;

let inMemoryTopCommanders: ScryfallCard[] | null = null;

interface TopCommanderCache {
  fetchedAt: number;
  cards: ScryfallCard[];
}

function getCache(): TopCommanderCache | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TopCommanderCache;
    if (!Array.isArray(parsed.cards) || typeof parsed.fetchedAt !== 'number') return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCache(cards: ScryfallCard[]) {
  try {
    const payload: TopCommanderCache = {
      fetchedAt: Date.now(),
      cards,
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage write failures.
  }
}

function getCardImage(card: ScryfallCard): string {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? '';
}

function sanitizeCommanderCards(cards: ScryfallCard[]): ScryfallCard[] {
  const seenNames = new Set<string>();

  return cards.filter((card) => {
    if (!card.name || seenNames.has(card.name)) return false;
    const hasImage = Boolean(getCardImage(card));
    if (!hasImage) return false;
    seenNames.add(card.name);
    return true;
  });
}

export async function getTopCommanders(limit = 300): Promise<ScryfallCard[]> {
  if (inMemoryTopCommanders && inMemoryTopCommanders.length >= limit) {
    return inMemoryTopCommanders.slice(0, limit);
  }

  const cached = getCache();
  if (cached && cached.cards.length >= limit) {
    inMemoryTopCommanders = cached.cards;
    return cached.cards.slice(0, limit);
  }

  const cards: ScryfallCard[] = [];
  let page = 1;

  while (cards.length < limit) {
    const params = new URLSearchParams({
      q: COMMANDER_QUERY,
      order: 'edhrec',
      dir: 'desc',
      unique: 'cards',
      page: String(page),
    });

    const response = await fetch(`${SCRYFALL_BASE}/cards/search?${params}`);
    if (!response.ok) {
      throw new Error(`Failed loading top commanders: ${response.status}`);
    }

    const data = (await response.json()) as { data?: ScryfallCard[]; has_more?: boolean };
    const pageCards = sanitizeCommanderCards(data.data ?? []);
    cards.push(...pageCards);

    if (!data.has_more) break;
    page += 1;
  }

  const uniqueCards = sanitizeCommanderCards(cards).slice(0, limit);
  inMemoryTopCommanders = uniqueCards;
  setCache(uniqueCards);
  return uniqueCards;
}

function utcDayIndex(value: Date): number {
  return Math.floor(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()) / DAY_MS);
}

export function getCommanderByDayOffset(commanders: ScryfallCard[], offset: number, now = new Date()): ScryfallCard | null {
  if (commanders.length === 0) return null;
  const seed = utcDayIndex(now);
  const raw = (seed + offset) % commanders.length;
  const index = raw >= 0 ? raw : raw + commanders.length;
  return commanders[index] ?? null;
}
