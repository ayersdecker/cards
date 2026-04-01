export type StorageTier = 'low' | 'mid' | 'high';

export interface StorageSettings {
  lowMax: number;
  midMax: number;
  lowLabel: string;
  midLabel: string;
  highLabel: string;
}

export const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
  lowMax: 1,
  midMax: 12,
  lowLabel: 'Back',
  midLabel: 'Binder',
  highLabel: 'Case',
};

const STORAGE_SETTINGS_KEY = 'mtg-storage-settings-v1';

export function normalizeStorageSettings(settings: StorageSettings): StorageSettings {
  const lowMax = Number.isFinite(settings.lowMax) ? Math.max(0, settings.lowMax) : DEFAULT_STORAGE_SETTINGS.lowMax;
  const midMaxBase = Number.isFinite(settings.midMax) ? settings.midMax : DEFAULT_STORAGE_SETTINGS.midMax;
  const midMax = Math.max(lowMax, midMaxBase);

  return {
    lowMax,
    midMax,
    lowLabel: settings.lowLabel.trim() || DEFAULT_STORAGE_SETTINGS.lowLabel,
    midLabel: settings.midLabel.trim() || DEFAULT_STORAGE_SETTINGS.midLabel,
    highLabel: settings.highLabel.trim() || DEFAULT_STORAGE_SETTINGS.highLabel,
  };
}

export function getStorageTier(priceStr: string | null, settings: StorageSettings): StorageTier {
  const price = parseFloat(priceStr ?? '0');
  if (Number.isNaN(price) || price < settings.lowMax) return 'low';
  if (price <= settings.midMax) return 'mid';
  return 'high';
}

export function getStorageRec(priceStr: string | null, settings: StorageSettings): string {
  const tier = getStorageTier(priceStr, settings);
  if (tier === 'low') return settings.lowLabel;
  if (tier === 'mid') return settings.midLabel;
  return settings.highLabel;
}

export function loadStorageSettings(): StorageSettings {
  if (typeof window === 'undefined') return DEFAULT_STORAGE_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_STORAGE_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<StorageSettings>;
    return normalizeStorageSettings({
      lowMax: parsed.lowMax ?? DEFAULT_STORAGE_SETTINGS.lowMax,
      midMax: parsed.midMax ?? DEFAULT_STORAGE_SETTINGS.midMax,
      lowLabel: parsed.lowLabel ?? DEFAULT_STORAGE_SETTINGS.lowLabel,
      midLabel: parsed.midLabel ?? DEFAULT_STORAGE_SETTINGS.midLabel,
      highLabel: parsed.highLabel ?? DEFAULT_STORAGE_SETTINGS.highLabel,
    });
  } catch {
    return DEFAULT_STORAGE_SETTINGS;
  }
}

export function saveStorageSettings(settings: StorageSettings): void {
  if (typeof window === 'undefined') return;

  const normalized = normalizeStorageSettings(settings);
  window.localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(normalized));
}