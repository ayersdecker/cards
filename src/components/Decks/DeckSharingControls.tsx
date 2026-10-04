import React, { useState } from 'react';
import type { Deck } from '../../types';

export default function DeckSharingControls({ deck, onToggle }: {
  deck: Deck;
  onToggle: (deckId: string, enabled: boolean) => Promise<string | null>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const shareUrl = deck.shareId ? `${window.location.origin}/shared/decks/${deck.shareId}` : '';

  const toggle = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await onToggle(deck.id, !deck.shareId);
      setMessage(deck.shareId ? 'Sharing turned off. The old link no longer works.' : 'Sharing enabled. Anyone with the link can view this deck.');
    } catch (err) {
      setError(`Unable to change sharing: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    setError('');
    setMessage('');
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage('Share link copied.');
    } catch {
      setError('Could not copy the link. Select and copy the link below instead.');
    }
  };

  return (
    <section className="deck-tools-panel" aria-labelledby="deck-sharing-title">
      <h3 id="deck-sharing-title">Share your deck</h3>
      <p className="muted">Decks are private by default. Enable an unlisted, read-only link that anyone can open without signing in. Your edits appear live; your collection, ownership checks, and proxy queue stay private.</p>
      <div className="btn-group deck-tool-actions">
        <button className={`btn ${deck.shareId ? 'btn-danger' : 'btn-outline'}`} disabled={busy} onClick={() => void toggle()}>
          {busy ? 'Updating sharing...' : deck.shareId ? 'Turn off sharing' : 'Enable share link'}
        </button>
        {shareUrl && <>
          <button className="btn btn-ghost" disabled={busy} onClick={() => void copyLink()}>Copy link</button>
          <a className="btn btn-ghost" href={shareUrl} target="_blank" rel="noreferrer">View shared deck</a>
        </>}
      </div>
      {shareUrl && <label>Read-only deck link<input readOnly value={shareUrl} onFocus={(event) => event.target.select()} /></label>}
      <p className="muted">Anyone with the link can forward it or save a copy. Turning sharing off revokes the link, not copies already saved. Enabling it again creates a new link.</p>
      {message && <p className="success-msg" role="status">{message}</p>}
      {error && <p className="error-msg" role="alert">{error}</p>}
    </section>
  );
}
