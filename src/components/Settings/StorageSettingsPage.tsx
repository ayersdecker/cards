import React, { useMemo, useState } from 'react';
import { useStorageSettings } from '../../context/StorageSettingsContext';
import { DEFAULT_STORAGE_SETTINGS } from '../../services/storageSettings';

export default function StorageSettingsPage() {
  const { settings, updateSettings, resetSettings } = useStorageSettings();
  const [lowMax, setLowMax] = useState(String(settings.lowMax));
  const [midMax, setMidMax] = useState(String(settings.midMax));
  const [lowLabel, setLowLabel] = useState(settings.lowLabel);
  const [midLabel, setMidLabel] = useState(settings.midLabel);
  const [highLabel, setHighLabel] = useState(settings.highLabel);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const preview = useMemo(
    () => [
      { price: '$0.50', label: lowLabel || settings.lowLabel },
      { price: '$5.00', label: midLabel || settings.midLabel },
      { price: '$25.00', label: highLabel || settings.highLabel },
    ],
    [highLabel, lowLabel, midLabel, settings.highLabel, settings.lowLabel, settings.midLabel]
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    const parsedLow = Number(lowMax);
    const parsedMid = Number(midMax);

    if (!Number.isFinite(parsedLow) || parsedLow < 0) {
      setError('Low price threshold must be a number >= 0.');
      setMessage('');
      return;
    }

    if (!Number.isFinite(parsedMid) || parsedMid < parsedLow) {
      setError('Mid price threshold must be a number >= low threshold.');
      setMessage('');
      return;
    }

    if (!lowLabel.trim() || !midLabel.trim() || !highLabel.trim()) {
      setError('All storage labels are required.');
      setMessage('');
      return;
    }

    updateSettings({
      lowMax: parsedLow,
      midMax: parsedMid,
      lowLabel,
      midLabel,
      highLabel,
    });

    setError('');
    setMessage('Storage settings saved.');
  };

  const handleReset = () => {
    resetSettings();
    setLowMax(String(DEFAULT_STORAGE_SETTINGS.lowMax));
    setMidMax(String(DEFAULT_STORAGE_SETTINGS.midMax));
    setLowLabel(DEFAULT_STORAGE_SETTINGS.lowLabel);
    setMidLabel(DEFAULT_STORAGE_SETTINGS.midLabel);
    setHighLabel(DEFAULT_STORAGE_SETTINGS.highLabel);
    setError('');
    setMessage('Storage settings reset to defaults.');
  };

  return (
    <div className="page">
      <h2 className="page-title">Storage <span className="accent-cyan">Settings</span></h2>
      <p className="muted">Customize storage recommendation thresholds and labels used across card views and XLSX exports.</p>

      <form className="settings-form" onSubmit={handleSave}>
        <div className="settings-grid">
          <label className="settings-field">
            <span>Low Tier Max Price (USD)</span>
            <input type="number" min="0" step="0.01" value={lowMax} onChange={(e) => setLowMax(e.target.value)} />
          </label>

          <label className="settings-field">
            <span>Mid Tier Max Price (USD)</span>
            <input type="number" min="0" step="0.01" value={midMax} onChange={(e) => setMidMax(e.target.value)} />
          </label>

          <label className="settings-field">
            <span>Low Tier Label</span>
            <input type="text" value={lowLabel} onChange={(e) => setLowLabel(e.target.value)} />
          </label>

          <label className="settings-field">
            <span>Mid Tier Label</span>
            <input type="text" value={midLabel} onChange={(e) => setMidLabel(e.target.value)} />
          </label>

          <label className="settings-field">
            <span>High Tier Label</span>
            <input type="text" value={highLabel} onChange={(e) => setHighLabel(e.target.value)} />
          </label>
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary">Save Settings</button>
          <button type="button" className="btn btn-ghost" onClick={handleReset}>Reset Defaults</button>
        </div>

        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error-msg">{error}</div>}
      </form>

      <section className="settings-preview">
        <h3>Preview</h3>
        <div className="settings-preview-grid">
          {preview.map((item) => (
            <div key={item.price} className="settings-preview-card">
              <span className="muted">{item.price}</span>
              <strong>{item.label}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}