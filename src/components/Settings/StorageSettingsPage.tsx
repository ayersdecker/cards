import React, { useMemo, useState } from 'react';
import { deleteUser } from 'firebase/auth';
import { useStorageSettings } from '../../context/StorageSettingsContext';
import { useAuth } from '../../context/AuthContext';
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

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
}

function summarizeRule(rule: StorageRule): string {
  const parts: string[] = [];
  if (rule.minPrice !== undefined || rule.maxPrice !== undefined) {
    if (rule.minPrice !== undefined && rule.maxPrice !== undefined) {
      parts.push(`$${rule.minPrice}-$${rule.maxPrice}`);
    } else if (rule.minPrice !== undefined) {
      parts.push(`>= $${rule.minPrice}`);
    } else if (rule.maxPrice !== undefined) {
      parts.push(`<= $${rule.maxPrice}`);
    }
  }
  if (rule.minCmc !== undefined || rule.maxCmc !== undefined) {
    if (rule.minCmc !== undefined && rule.maxCmc !== undefined) {
      parts.push(`CMC ${rule.minCmc}-${rule.maxCmc}`);
    } else if (rule.minCmc !== undefined) {
      parts.push(`CMC >= ${rule.minCmc}`);
    } else if (rule.maxCmc !== undefined) {
      parts.push(`CMC <= ${rule.maxCmc}`);
    }
  }
  if (rule.colorsAny && rule.colorsAny.length > 0) {
    parts.push(`colors: ${rule.colorsAny.join(', ')}`);
  }
  if (rule.typeIncludes) parts.push(`type has "${rule.typeIncludes}"`);
  if (rule.nameIncludes) parts.push(`name has "${rule.nameIncludes}"`);
  if (rule.setCode) parts.push(`set: ${rule.setCode.toUpperCase()}`);

  if (parts.length === 0) return 'Matches any card';
  return parts.join(' • ');
}

export default function StorageSettingsPage() {
  const { user, logout } = useAuth();
  const { settings, updateSettings, resetSettings } = useStorageSettings();
  const [rules, setRules] = useState<StorageRule[]>(settings.rules);
  const [expandedRuleIds, setExpandedRuleIds] = useState<string[]>(settings.rules[0] ? [settings.rules[0].id] : []);
  const [fallbackLabel, setFallbackLabel] = useState(settings.fallbackLabel);
  const [fallbackTone, setFallbackTone] = useState<StorageTone>(settings.fallbackTone);
  const [includeAllPrintings, setIncludeAllPrintings] = useState(settings.includeAllPrintings);
  const [preferredSetCode, setPreferredSetCode] = useState(settings.preferredSetCode ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

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
    setExpandedRuleIds((prev) => prev.filter((ruleId) => ruleId !== id));
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
    setRules((prev) => {
      const nextRule = createEmptyRule(prev.length);
      setExpandedRuleIds((expanded) => [...expanded, nextRule.id]);
      return [...prev, nextRule];
    });
  };

  const toggleRuleOpen = (id: string) => {
    setExpandedRuleIds((prev) =>
      prev.includes(id) ? prev.filter((ruleId) => ruleId !== id) : [...prev, id]
    );
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
    setExpandedRuleIds(DEFAULT_STORAGE_SETTINGS.rules[0] ? [DEFAULT_STORAGE_SETTINGS.rules[0].id] : []);
    setFallbackLabel(DEFAULT_STORAGE_SETTINGS.fallbackLabel);
    setFallbackTone(DEFAULT_STORAGE_SETTINGS.fallbackTone);
    setIncludeAllPrintings(DEFAULT_STORAGE_SETTINGS.includeAllPrintings);
    setPreferredSetCode(DEFAULT_STORAGE_SETTINGS.preferredSetCode ?? '');
    setError('');
    setMessage('Rule settings reset to defaults.');
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      setAccountError('No signed-in account found.');
      setAccountMessage('');
      return;
    }

    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      setAccountError('Type DELETE to confirm account deletion.');
      setAccountMessage('');
      return;
    }

    setDeleting(true);
    setAccountError('');
    setAccountMessage('');
    try {
      await deleteUser(user);
      setAccountMessage('Account deleted successfully.');
      setDeleteConfirm('');
      await logout();
    } catch (deleteError: unknown) {
      const msg = deleteError instanceof Error ? deleteError.message : 'Could not delete account.';
      setAccountError(`Delete failed: ${msg}. You may need to sign out and sign in again, then retry.`);
    } finally {
      setDeleting(false);
    }
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
                <div>
                  <strong>Rule {index + 1}: {rule.label || `Rule ${index + 1}`}</strong>
                  <p className="muted settings-rule-summary">{summarizeRule(rule)}</p>
                </div>
                <div className="settings-rule-head-actions">
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => toggleRuleOpen(rule.id)}>
                    {expandedRuleIds.includes(rule.id) ? 'Collapse' : 'Edit'}
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => moveRule(rule.id, -1)}>↑</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => moveRule(rule.id, 1)}>↓</button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeRule(rule.id)}>Delete</button>
                </div>
              </div>

              {expandedRuleIds.includes(rule.id) && (
                <div className="settings-rule-content">
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
              )}
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

      <section className="settings-form settings-account-card">
        <h3>Account</h3>
        <div className="settings-preview-grid">
          <div className="settings-preview-card">
            <strong>Email</strong>
            <span className="muted">{user?.email ?? 'Unknown'}</span>
          </div>
          <div className="settings-preview-card">
            <strong>User ID</strong>
            <span className="muted">{user?.uid ?? 'Unknown'}</span>
          </div>
          <div className="settings-preview-card">
            <strong>Created</strong>
            <span className="muted">{formatDate(user?.metadata.creationTime)}</span>
          </div>
          <div className="settings-preview-card">
            <strong>Last Sign In</strong>
            <span className="muted">{formatDate(user?.metadata.lastSignInTime)}</span>
          </div>
        </div>

        <div className="settings-account-danger">
          <h4>Danger Zone</h4>
          <p className="muted">Delete your account permanently. This cannot be undone.</p>
          <div className="settings-account-delete-row">
            <input
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
          {accountMessage && <div className="success-msg">{accountMessage}</div>}
          {accountError && <div className="error-msg">{accountError}</div>}
        </div>
      </section>
    </div>
  );
}
