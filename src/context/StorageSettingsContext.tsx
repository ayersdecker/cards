import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  DEFAULT_STORAGE_SETTINGS,
  loadStorageSettings,
  normalizeStorageSettings,
  saveStorageSettings,
  type StorageSettings,
} from '../services/storageSettings';

interface StorageSettingsContextType {
  settings: StorageSettings;
  updateSettings: (next: StorageSettings) => void;
  resetSettings: () => void;
}

const StorageSettingsContext = createContext<StorageSettingsContextType | null>(null);

export function StorageSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StorageSettings>(() => loadStorageSettings());

  const updateSettings = (next: StorageSettings) => {
    const normalized = normalizeStorageSettings(next);
    setSettings(normalized);
    saveStorageSettings(normalized);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_STORAGE_SETTINGS);
    saveStorageSettings(DEFAULT_STORAGE_SETTINGS);
  };

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings]
  );

  return (
    <StorageSettingsContext.Provider value={value}>
      {children}
    </StorageSettingsContext.Provider>
  );
}

export function useStorageSettings() {
  const ctx = useContext(StorageSettingsContext);
  if (!ctx) throw new Error('useStorageSettings must be used within StorageSettingsProvider');
  return ctx;
}