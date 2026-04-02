import type { ScryfallCard } from '../types';
import { getCardByExactName, getCardByName } from './scryfall';

export interface ParsedListEntry {
  name: string;
  quantity: number;
  setCode?: string;
}

export interface ResolvedListEntry {
  card: ScryfallCard;
  quantity: number;
}

export interface BulkImportResult {
  resolved: ResolvedListEntry[];
  missing: string[];
}

interface ResolveBulkOptions {
  preferredSetCode?: string;
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

function parseSetCode(line: string): { name: string; setCode?: string } {
  const bracketMatch = line.match(/^(.*)\[([a-zA-Z0-9]{2,10})\]\s*$/);
  if (bracketMatch) {
    return {
      name: bracketMatch[1].trim(),
      setCode: bracketMatch[2].trim().toLowerCase(),
    };
  }

  const pipeParts = line.split('|');
  if (pipeParts.length === 2) {
    const [namePart, setPart] = pipeParts;
    const setCode = setPart.trim().toLowerCase();
    if (setCode) {
      return { name: namePart.trim(), setCode };
    }
  }

  return { name: line.trim() };
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
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

    const withSet = parseSetCode(parsed.name);
    parsed.name = withSet.name;
    parsed.setCode = withSet.setCode;

    if (!parsed.name || parsed.quantity <= 0) continue;

    const key = `${parsed.name.toLowerCase()}::${parsed.setCode ?? ''}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += parsed.quantity;
    } else {
      merged.set(key, { ...parsed });
    }
  }

  return Array.from(merged.values());
}

export async function resolveBulkCardList(
  input: string,
  options: ResolveBulkOptions = {}
): Promise<BulkImportResult> {
  const parsedEntries = parseBulkCardList(input);
  const resolved: ResolvedListEntry[] = [];
  const missing: string[] = [];
  const preferredSetCode = options.preferredSetCode?.trim().toLowerCase();

  for (const entry of parsedEntries) {
    const resolvedSetCode = entry.setCode ?? preferredSetCode;
    let card = await getCardByExactName(entry.name, resolvedSetCode);

    if (!card && !resolvedSetCode) {
      const fuzzy = await getCardByName(entry.name);
      if (fuzzy && normalizeName(fuzzy.name) === normalizeName(entry.name)) {
        card = fuzzy;
      }
    }

    if (!card) {
      missing.push(entry.setCode ? `${entry.name} [${entry.setCode}]` : entry.name);
      continue;
    }

    resolved.push({ card, quantity: entry.quantity });
  }

  return { resolved, missing };
}