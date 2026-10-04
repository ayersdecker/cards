import React, { useState } from 'react';
import { downloadDeckText, formatDeckText, type DeckTextFormat, type ExportableDeck } from '../../services/deckExport';

export default function DeckExportControls({ deck, onXlsx }: {
  deck: ExportableDeck;
  onXlsx?: () => Promise<void>;
}) {
  const [format, setFormat] = useState<DeckTextFormat>('archidekt');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const perform = async (action: () => void | Promise<void>, success: string) => {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await action();
      setMessage(success);
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : 'Please try again.'} You can also copy from the preview below.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="deck-tools-panel" aria-labelledby="deck-export-title">
      <h3 id="deck-export-title">Export decklist</h3>
      <p className="muted">Download or copy a text list, then use the destination site's text import. Names and quantities are included; specific printings are not.</p>
      <div className="btn-group deck-tool-actions">
        <label className="deck-export-format">
          Format
          <select value={format} onChange={(event) => {
            setFormat(event.target.value === 'moxfield' ? 'moxfield' : 'archidekt');
            setMessage('');
            setError('');
          }}>
            <option value="archidekt">Archidekt</option>
            <option value="moxfield">Moxfield</option>
          </select>
        </label>
        <button className="btn btn-primary" disabled={busy || !deck.cards.length}
          onClick={() => void perform(() => downloadDeckText(deck, format), 'Text download started.')}>
          Download TXT
        </button>
        <button className="btn btn-outline" disabled={busy || !deck.cards.length}
          onClick={() => void perform(() => navigator.clipboard.writeText(formatDeckText(deck, format)), 'Decklist copied.')}>
          Copy decklist
        </button>
        {onXlsx && <button className="btn btn-ghost" disabled={busy}
          onClick={() => void perform(onXlsx, 'XLSX export complete.')}>Export XLSX</button>}
      </div>
      <p className="muted">Commander and sideboard sections are marked. Check the destination deck's format, commander assignment, and zones after importing.</p>
      {message && <p className="success-msg" role="status">{message}</p>}
      {error && <p className="error-msg" role="alert">{error}</p>}
      <details className="deck-export-preview">
        <summary>Preview / manually copy text</summary>
        <textarea aria-label="Exported decklist" readOnly rows={8} value={formatDeckText(deck, format)} />
      </details>
    </section>
  );
}
