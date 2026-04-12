import type { ScryfallCard } from '../types';
import { getCardAutocomplete, getCardByExactName, getCardByName } from './scryfall';

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
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  const normalized = normalizeName(value);
  if (!normalized) return [];
  return normalized.split(' ');
}

function looksLikeReasonableFuzzyMatch(input: string, candidate: string): boolean {
  const source = normalizeName(input);
  const target = normalizeName(candidate);
  if (!source || !target) return false;
  if (source === target) return true;

  if (target.startsWith(`${source} `) || target.includes(` ${source} `) || target.endsWith(` ${source}`)) {
    return true;
  }

  const sourceTokens = tokenize(source);
  const targetTokens = new Set(tokenize(target));
  if (sourceTokens.length === 0) return false;

  const matchingTokens = sourceTokens.filter((token) => targetTokens.has(token)).length;
  return matchingTokens >= Math.max(1, Math.ceil(sourceTokens.length * 0.6));
}

async function resolveEntryCard(entryName: string, setCode?: string): Promise<ScryfallCard | null> {
  const suggestions = await getCardAutocomplete(entryName);

  const exactSuggestion = suggestions.find(
    (suggestion) => normalizeName(suggestion) === normalizeName(entryName)
  );

  const candidateNames = [exactSuggestion, ...suggestions, entryName]
    .filter((value): value is string => Boolean(value && value.trim()))
    .filter((value, index, arr) => arr.findIndex((x) => normalizeName(x) === normalizeName(value)) === index)
    .slice(0, 4);

  for (const candidate of candidateNames) {
    const card = await getCardByExactName(candidate, setCode);
    if (card) return card;
  }

  const fuzzy = await getCardByName(entryName);
  if (fuzzy && looksLikeReasonableFuzzyMatch(entryName, fuzzy.name)) {
    if (!setCode) return fuzzy;
    const inRequestedSet = await getCardByExactName(fuzzy.name, setCode);
    return inRequestedSet ?? fuzzy;
  }

  return null;
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
    let card = await resolveEntryCard(entry.name, resolvedSetCode);

    if (!card && resolvedSetCode && !entry.setCode) {
      // If preferred set has no print, fall back to any print so import still succeeds.
      card = await resolveEntryCard(entry.name);
    }

    if (!card) {
      const label = entry.setCode ? `${entry.name} [${entry.setCode}]` : entry.name;
      missing.push(entry.quantity > 1 ? `${entry.quantity}x ${label}` : label);
      continue;
    }

    resolved.push({ card, quantity: entry.quantity });
  }

  return { resolved, missing };
}