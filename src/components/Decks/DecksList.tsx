import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDecks } from '../../hooks/useFirestore';

export default function DecksList() {
  const { user } = useAuth();
  const { decks, loading, createDeck, deleteDeck, updateDeck } = useDecks(user?.uid ?? null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createDeck(newName.trim());
    setNewName('');
  };

  const handleRename = async (id: string) => {
    if (!renameVal.trim()) return;
    await updateDeck(id, { name: renameVal.trim() });
    setRenaming(null);
  };

  return (
    <div className="page">
      <h2 className="page-title">My <span className="accent-magenta">Decks</span></h2>
      <form onSubmit={handleCreate} className="create-form">
        <input
          placeholder="New deck name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Create</button>
      </form>
      {loading && <p>Loading…</p>}
      <div className="list-grid">
        {decks.map((deck) => {
          const mainCount = deck.cards
            .filter((c) => !c.isSideboard)
            .reduce((s, c) => s + c.quantity, 0);
          const sideCount = deck.cards
            .filter((c) => c.isSideboard)
            .reduce((s, c) => s + c.quantity, 0);
          return (
            <div key={deck.id} className="list-card">
              {renaming === deck.id ? (
                <div className="rename-row">
                  <input
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    autoFocus
                  />
                  <button className="btn btn-sm btn-primary" onClick={() => handleRename(deck.id)}>Save</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setRenaming(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <Link to={`/decks/${deck.id}`} className="list-card-name">{deck.name}</Link>
                  {deck.isCommander && <div className="list-card-tag">Commander</div>}
                  <div className="list-card-meta">
                    Main: {mainCount} | Side: {sideCount}
                  </div>
                  <div className="list-card-actions">
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => { setRenaming(deck.id); setRenameVal(deck.name); }}
                    >
                      Rename
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteDeck(deck.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
