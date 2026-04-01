import type { ScryfallCard } from '../types';
import { getCardByName } from './scryfall';

export interface ParsedListEntry {
  name: string;
  quantity: number;
}

export interface ResolvedListEntry {
  card: ScryfallCard;
  quantity: number;
}

export interface BulkImportResult {
  resolved: ResolvedListEntry[];
  missing: string[];
}

function parseQuantityPrefix(line: string): ParsedListEntry | null {
  const match = line.match(/^(\d+)\s*x?\s+(.+)$/i);
  if (!match) return null;

  return {
    quantity: Number(match[1]),
    name: match[2].trim(),
  };
}

function parseQuantitySuffix(line: string): ParsedListEntry | null {
  const match = line.match(/^(.+?)\s+x(\d+)$/i);
  if (!match) return null;

  return {
    name: match[1].trim(),
    quantity: Number(match[2]),
  };
}

export function parseBulkCardList(input: string): ParsedListEntry[] {
  const merged = new Map<string, ParsedListEntry>();

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const parsed = parseQuantityPrefix(line) ?? parseQuantitySuffix(line) ?? {
      name: line,
      quantity: 1,
    };

    if (!parsed.name || parsed.quantity <= 0) continue;

    const key = parsed.name.toLowerCase();
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += parsed.quantity;
    } else {
      merged.set(key, { ...parsed });
    }
  }

  return Array.from(merged.values());
}

export async function resolveBulkCardList(input: string): Promise<BulkImportResult> {
  const parsedEntries = parseBulkCardList(input);
  const resolved: ResolvedListEntry[] = [];
  const missing: string[] = [];

  for (const entry of parsedEntries) {
    const card = await getCardByName(entry.name);
    if (!card) {
      missing.push(entry.name);
      continue;
    }

    resolved.push({ card, quantity: entry.quantity });
  }

  return { resolved, missing };
}