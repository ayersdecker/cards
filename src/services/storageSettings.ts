export type StorageTone = 'low' | 'mid' | 'high';

export interface StorageRule {
  id: string;
  label: string;
  tone: StorageTone;
  minPrice?: number;
  maxPrice?: number;
  minCmc?: number;
  maxCmc?: number;
  colorsAny?: string[];
  typeIncludes?: string;
  nameIncludes?: string;
  setCode?: string;
}

export interface StorageSettings {
  fallbackLabel: string;
  fallbackTone: StorageTone;
  rules: StorageRule[];
}

export interface StorageInput {
  price: string | null;
  name?: string;
  set?: string;
  set_name?: string;
  colors?: string[];
  cmc?: number;
  type_line?: string;
  mana_cost?: string;
}

const STORAGE_SETTINGS_KEY = 'mtg-storage-settings-v2';
const LEGACY_STORAGE_SETTINGS_KEY = 'mtg-storage-settings-v1';

function makeDefaultRules(): StorageRule[] {
  return [
    {
      id: 'price-low',
      label: 'Back',
      tone: 'low',
      maxPrice: 0.99,
    },
    {
      id: 'price-mid',
      label: 'Binder',
      tone: 'mid',
      minPrice: 1,
      maxPrice: 12,
    },
    {
      id: 'price-high',
      label: 'Case',
      tone: 'high',
      minPrice: 12.01,
    },
  ];
}

export const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
  fallbackLabel: 'Back',
  fallbackTone: 'low',
  rules: makeDefaultRules(),
};

function normalizeTone(tone: string | undefined): StorageTone {
  if (tone === 'low' || tone === 'mid' || tone === 'high') return tone;
  return 'low';
}

function normalizeColors(colors: string[] | undefined): string[] {
  if (!colors || colors.length === 0) return [];
  return colors
    .map((value) => value.trim().toUpperCase())
    .filter((value) => ['W', 'U', 'B', 'R', 'G'].includes(value));
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value;
}

export function createEmptyRule(index: number): StorageRule {
  return {
    id: `rule-${Date.now()}-${index}`,
    label: `Rule ${index + 1}`,
    tone: 'mid',
  };
}

export function normalizeStorageRule(rule: StorageRule, index: number): StorageRule {
  const label = rule.label?.trim() || `Rule ${index + 1}`;
  const minPrice = normalizeNumber(rule.minPrice);
  const maxPrice = normalizeNumber(rule.maxPrice);
  const minCmc = normalizeNumber(rule.minCmc);
  const maxCmc = normalizeNumber(rule.maxCmc);

  return {
    id: rule.id || `rule-${Date.now()}-${index}`,
    label,
    tone: normalizeTone(rule.tone),
    minPrice,
    maxPrice,
    minCmc,
    maxCmc,
    colorsAny: normalizeColors(rule.colorsAny),
    typeIncludes: rule.typeIncludes?.trim() || undefined,
    nameIncludes: rule.nameIncludes?.trim() || undefined,
    setCode: rule.setCode?.trim().toLowerCase() || undefined,
  };
}

function migrateV1Settings(raw: unknown): StorageSettings | null {
  if (!raw || typeof raw !== 'object') return null;
  const maybe = raw as {
    lowMax?: number;
    midMax?: number;
    lowLabel?: string;
    midLabel?: string;
    highLabel?: string;
  };

  if (typeof maybe.lowMax !== 'number' && typeof maybe.midMax !== 'number') return null;

  const lowMax = typeof maybe.lowMax === 'number' && Number.isFinite(maybe.lowMax) ? maybe.lowMax : 1;
  const midCandidate = typeof maybe.midMax === 'number' && Number.isFinite(maybe.midMax) ? maybe.midMax : 12;
  const midMax = Math.max(lowMax, midCandidate);

  return {
    fallbackLabel: (maybe.lowLabel || 'Back').trim() || 'Back',
    fallbackTone: 'low',
    rules: [
      {
        id: 'price-low',
        label: (maybe.lowLabel || 'Back').trim() || 'Back',
        tone: 'low',
        maxPrice: Math.max(0, lowMax),
      },
      {
        id: 'price-mid',
        label: (maybe.midLabel || 'Binder').trim() || 'Binder',
        tone: 'mid',
        minPrice: Math.max(0, lowMax),
        maxPrice: Math.max(0, midMax),
      },
      {
        id: 'price-high',
        label: (maybe.highLabel || 'Case').trim() || 'Case',
        tone: 'high',
        minPrice: Math.max(0, midMax),
      },
    ],
  };
}

export function normalizeStorageSettings(settings: StorageSettings): StorageSettings {
  const rules = (settings.rules || []).map((rule, index) => normalizeStorageRule(rule, index));

  return {
    fallbackLabel: settings.fallbackLabel?.trim() || DEFAULT_STORAGE_SETTINGS.fallbackLabel,
    fallbackTone: normalizeTone(settings.fallbackTone),
    rules,
  };
}

function containsIgnoreCase(value: string | undefined, needle: string | undefined): boolean {
  if (!needle) return true;
  if (!value) return false;
  return value.toLowerCase().includes(needle.toLowerCase());
}

function matchesRule(input: StorageInput, rule: StorageRule): boolean {
  const price = parseFloat(input.price ?? '0');
  const safePrice = Number.isNaN(price) ? 0 : price;

  if (rule.minPrice !== undefined && safePrice < rule.minPrice) return false;
  if (rule.maxPrice !== undefined && safePrice > rule.maxPrice) return false;

  if (rule.minCmc !== undefined) {
    if (input.cmc === undefined || input.cmc < rule.minCmc) return false;
  }

  if (rule.maxCmc !== undefined) {
    if (input.cmc === undefined || input.cmc > rule.maxCmc) return false;
  }

  if (rule.colorsAny && rule.colorsAny.length > 0) {
    const inputColors = (input.colors || []).map((value) => value.toUpperCase());
    const hasColorMatch = rule.colorsAny.some((color) => inputColors.includes(color));
    if (!hasColorMatch) return false;
  }

  if (!containsIgnoreCase(input.type_line, rule.typeIncludes)) return false;
  if (!containsIgnoreCase(input.name, rule.nameIncludes)) return false;

  if (rule.setCode) {
    const inputSet = input.set?.toLowerCase();
    if (!inputSet || inputSet !== rule.setCode.toLowerCase()) return false;
  }

  return true;
}

export function getStorageRec(input: StorageInput, settings: StorageSettings): string {
  for (const rule of settings.rules) {
    if (matchesRule(input, rule)) return rule.label;
  }
  return settings.fallbackLabel;
}

export function getStorageTone(input: StorageInput, settings: StorageSettings): StorageTone {
  for (const rule of settings.rules) {
    if (matchesRule(input, rule)) return rule.tone;
  }
  return settings.fallbackTone;
}

export function loadStorageSettings(): StorageSettings {
  if (typeof window === 'undefined') return DEFAULT_STORAGE_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) {
      const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_SETTINGS_KEY);
      if (!legacyRaw) return DEFAULT_STORAGE_SETTINGS;
      const legacyParsed = JSON.parse(legacyRaw) as unknown;
      const migratedLegacy = migrateV1Settings(legacyParsed);
      if (!migratedLegacy) return DEFAULT_STORAGE_SETTINGS;
      const normalizedLegacy = normalizeStorageSettings(migratedLegacy);
      saveStorageSettings(normalizedLegacy);
      return normalizedLegacy;
    }

    const parsed = JSON.parse(raw) as StorageSettings;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STORAGE_SETTINGS;

    const migrated = migrateV1Settings(parsed);
    if (migrated) return normalizeStorageSettings(migrated);

    return normalizeStorageSettings(parsed);
  } catch {
    return DEFAULT_STORAGE_SETTINGS;
  }
}

export function saveStorageSettings(settings: StorageSettings): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeStorageSettings(settings);
  window.localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(normalized));
}
