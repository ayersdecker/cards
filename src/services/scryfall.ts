import type { ScryfallCard, ScryfallSearchResponse } from '../types';

const BASE = 'https://api.scryfall.com';

export async function searchCards(query: string, page = 1): Promise<ScryfallSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    order: 'released',
    dir: 'desc',
    page: String(page),
  });
  const res = await fetch(`${BASE}/cards/search?${params}`);
  if (!res.ok) {
    if (res.status === 404) return { object: 'list', total_cards: 0, has_more: false, data: [] };
    throw new Error(`Scryfall error: ${res.status}`);
  }
  return res.json();
}

export async function getCardByName(name: string): Promise<ScryfallCard | null> {
  const params = new URLSearchParams({ fuzzy: name });
  const res = await fetch(`${BASE}/cards/named?${params}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getCardByExactName(
  name: string,
  setCode?: string
): Promise<ScryfallCard | null> {
  const cleanedName = name.trim();
  if (!cleanedName) return null;

  let query = `!"${cleanedName.replace(/"/g, '\\"')}"`;
  if (setCode?.trim()) {
    query += ` set:${setCode.trim().toLowerCase()}`;
  }

  const params = new URLSearchParams({
    q: query,
    unique: 'prints',
    order: 'released',
    dir: 'desc',
  });

  const res = await fetch(`${BASE}/cards/search?${params}`);
  if (!res.ok) return null;

  const data = (await res.json()) as ScryfallSearchResponse;
  return data.data[0] ?? null;
}

export async function getCardById(id: string): Promise<ScryfallCard | null> {
  const res = await fetch(`${BASE}/cards/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export function getCardImage(card: ScryfallCard): string {
  return (
    card.image_uris?.normal ??
    card.card_faces?.[0]?.image_uris?.normal ??
    ''
  );
}

export const COLOR_MAP: Record<string, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
};

export function mapColors(colors: string[]): string {
  if (!colors || colors.length === 0) return 'Colorless';
  return colors.map((c) => COLOR_MAP[c] ?? c).join(', ');
}

export async function getSimilarCards(card: ScryfallCard): Promise<ScryfallCard[]> {
  const colors = card.colors ?? card.color_identity;
  const colorQuery = colors.length > 0 ? `c:${colors.join('')}` : 'c:colorless';
  const cmc = Math.round(card.cmc);
  const query = `${colorQuery} cmc=${cmc} -name:"${card.name}"`;
  try {
    const result = await searchCards(query);
    return result.data.slice(0, 8);
  } catch {
    return [];
  }
}
