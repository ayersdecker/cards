import React, { useMemo, useState } from 'react';
import { useStorageSettings } from '../../context/StorageSettingsContext';
import {
  DEFAULT_STORAGE_SETTINGS,
  createEmptyRule,
  type StorageRule,
  type StorageTone,
} from '../../services/storageSettings';

const TONED_LABELS: Record<StorageTone, string> = {
  low: 'Magenta',
  mid: 'Cyan',
  high: 'Yellow',
};

function parseColors(raw: string): string[] {
  return raw
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value) => ['W', 'U', 'B', 'R', 'G'].includes(value));
}

function formatColors(colors?: string[]): string {
  if (!colors || colors.length === 0) return '';
  return colors.join(', ');
}

export default function StorageSettingsPage() {
  const { settings, updateSettings, resetSettings } = useStorageSettings();
  const [rules, setRules] = useState<StorageRule[]>(settings.rules);
  const [fallbackLabel, setFallbackLabel] = useState(settings.fallbackLabel);
  const [fallbackTone, setFallbackTone] = useState<StorageTone>(settings.fallbackTone);
  const [includeAllPrintings, setIncludeAllPrintings] = useState(settings.includeAllPrintings);
  const [preferredSetCode, setPreferredSetCode] = useState(settings.preferredSetCode ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const examples = useMemo(
    () => [
      {
        name: 'Lightning Bolt',
        meta: 'R instant, CMC 1, $2.10',
      },
      {
        name: 'Gilded Lotus',
        meta: 'Artifact, CMC 5, $0.70',
      },
      {
        name: 'Ragavan, Nimble Pilferer',
        meta: 'R creature, CMC 1, $35.00',
      },
    ],
    []
  );

  const updateRule = (id: string, patch: Partial<StorageRule>) => {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  const moveRule = (id: string, direction: -1 | 1) => {
    setRules((prev) => {
      const index = prev.findIndex((rule) => rule.id === id);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const handleAddRule = () => {
    setRules((prev) => [...prev, createEmptyRule(prev.length)]);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    if (!fallbackLabel.trim()) {
      setError('Fallback label is required.');
      setMessage('');
      return;
    }

    if (rules.length === 0) {
      setError('Add at least one rule.');
      setMessage('');
      return;
    }

    const invalidRule = rules.find((rule) => !rule.label?.trim());
    if (invalidRule) {
      setError('Every rule needs a label.');
      setMessage('');
      return;
    }

    updateSettings({
      fallbackLabel,
      fallbackTone,
      rules,
      includeAllPrintings,
      preferredSetCode,
    });

    setError('');
    setMessage('Rule settings saved. Rules are checked top-to-bottom.');
  };

  const handleReset = () => {
    resetSettings();
    setRules(DEFAULT_STORAGE_SETTINGS.rules);
    setFallbackLabel(DEFAULT_STORAGE_SETTINGS.fallbackLabel);
    setFallbackTone(DEFAULT_STORAGE_SETTINGS.fallbackTone);
    setIncludeAllPrintings(DEFAULT_STORAGE_SETTINGS.includeAllPrintings);
    setPreferredSetCode(DEFAULT_STORAGE_SETTINGS.preferredSetCode ?? '');
    setError('');
    setMessage('Rule settings reset to defaults.');
  };

  return (
    <div className="page">
      <h2 className="page-title">Storage <span className="accent-cyan">Rule Builder</span></h2>
      <p className="muted">Create your own rules using any combination of price, color, type, card name, set code, and CMC. First matching rule wins.</p>

      <form className="settings-form" onSubmit={handleSave}>
        <div className="settings-actions">
          <button type="button" className="btn btn-outline" onClick={handleAddRule}>Add Rule</button>
          <button type="submit" className="btn btn-primary">Save Rules</button>
          <button type="button" className="btn btn-ghost" onClick={handleReset}>Reset Defaults</button>
        </div>

        <div className="settings-fallback-card">
          <h3>Search Preferences</h3>
          <div className="settings-grid">
            <label className="settings-field settings-checkbox">
              <span>Return all printings / variations in search</span>
              <input
                type="checkbox"
                checked={includeAllPrintings}
                onChange={(e) => setIncludeAllPrintings(e.target.checked)}
              />
            </label>

            <label className="settings-field">
              <span>Preferred Set Code (optional)</span>
              <input
                placeholder="M11"
                value={preferredSetCode}
                onChange={(e) => setPreferredSetCode(e.target.value.toUpperCase())}
              />
            </label>
          </div>
          <p className="muted">
            Preferred set code is used for bulk imports/search when a card name is ambiguous and no set is specified.
          </p>
        </div>

        <div className="settings-rule-list">
          {rules.map((rule, index) => (
            <div className="settings-rule-card" key={rule.id}>
              <div className="settings-rule-head">
                <strong>Rule {index + 1}</strong>
                <div className="settings-rule-head-actions">
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => moveRule(rule.id, -1)}>↑</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => moveRule(rule.id, 1)}>↓</button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeRule(rule.id)}>Delete</button>
                </div>
              </div>

              <div className="settings-grid">
                <label className="settings-field">
                  <span>Result Label</span>
                  <input value={rule.label} onChange={(e) => updateRule(rule.id, { label: e.target.value })} />
                </label>

                <label className="settings-field">
                  <span>Badge Tone</span>
                  <select value={rule.tone} onChange={(e) => updateRule(rule.id, { tone: e.target.value as StorageTone })}>
                    <option value="low">{TONED_LABELS.low}</option>
                    <option value="mid">{TONED_LABELS.mid}</option>
                    <option value="high">{TONED_LABELS.high}</option>
                  </select>
                </label>

                <label className="settings-field">
                  <span>Min Price</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rule.minPrice ?? ''}
                    onChange={(e) => updateRule(rule.id, { minPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </label>

                <label className="settings-field">
                  <span>Max Price</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rule.maxPrice ?? ''}
                    onChange={(e) => updateRule(rule.id, { maxPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </label>

                <label className="settings-field">
                  <span>Min CMC</span>
                  <input
                    type="number"
                    step="1"
                    value={rule.minCmc ?? ''}
                    onChange={(e) => updateRule(rule.id, { minCmc: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </label>

                <label className="settings-field">
                  <span>Max CMC</span>
                  <input
                    type="number"
                    step="1"
                    value={rule.maxCmc ?? ''}
                    onChange={(e) => updateRule(rule.id, { maxCmc: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </label>

                <label className="settings-field">
                  <span>Colors (Any)</span>
                  <input
                    placeholder="W, U, B, R, G"
                    value={formatColors(rule.colorsAny)}
                    onChange={(e) => updateRule(rule.id, { colorsAny: parseColors(e.target.value) })}
                  />
                </label>

                <label className="settings-field">
                  <span>Type Contains</span>
                  <input
                    placeholder="Creature, Artifact, Land..."
                    value={rule.typeIncludes ?? ''}
                    onChange={(e) => updateRule(rule.id, { typeIncludes: e.target.value || undefined })}
                  />
                </label>

                <label className="settings-field">
                  <span>Name Contains</span>
                  <input
                    placeholder="Dragon, Bolt, etc."
                    value={rule.nameIncludes ?? ''}
                    onChange={(e) => updateRule(rule.id, { nameIncludes: e.target.value || undefined })}
                  />
                </label>

                <label className="settings-field">
                  <span>Set Code</span>
                  <input
                    placeholder="M11"
                    value={rule.setCode ?? ''}
                    onChange={(e) => updateRule(rule.id, { setCode: e.target.value || undefined })}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="settings-fallback-card">
          <h3>Fallback (If No Rules Match)</h3>
          <div className="settings-grid">
            <label className="settings-field">
              <span>Fallback Label</span>
              <input value={fallbackLabel} onChange={(e) => setFallbackLabel(e.target.value)} />
            </label>
            <label className="settings-field">
              <span>Fallback Badge Tone</span>
              <select value={fallbackTone} onChange={(e) => setFallbackTone(e.target.value as StorageTone)}>
                <option value="low">{TONED_LABELS.low}</option>
                <option value="mid">{TONED_LABELS.mid}</option>
                <option value="high">{TONED_LABELS.high}</option>
              </select>
            </label>
          </div>
        </div>

        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error-msg">{error}</div>}
      </form>

      <section className="settings-preview">
        <h3>How Rules Work</h3>
        <p className="muted">Rules are checked in order. The first rule that matches the card metadata is used.</p>
        <div className="settings-preview-grid">
          {examples.map((example) => (
            <div key={example.name} className="settings-preview-card">
              <strong>{example.name}</strong>
              <span className="muted">{example.meta}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
