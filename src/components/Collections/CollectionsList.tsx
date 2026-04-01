import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollections } from '../../hooks/useFirestore';

export default function CollectionsList() {
  const { user } = useAuth();
  const { collections, loading, createCollection, deleteCollection, updateCollection } =
    useCollections(user?.uid ?? null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createCollection(newName.trim());
    setNewName('');
  };

  const handleRename = async (id: string) => {
    if (!renameVal.trim()) return;
    await updateCollection(id, { name: renameVal.trim() });
    setRenaming(null);
  };

  return (
    <div className="page">
      <h2 className="page-title">My <span className="accent-cyan">Collections</span></h2>
      <form onSubmit={handleCreate} className="create-form">
        <input
          placeholder="New collection name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Create</button>
      </form>
      {loading && <p>Loading…</p>}
      <div className="list-grid">
        {collections.map((col) => (
          <div key={col.id} className="list-card">
            {renaming === col.id ? (
              <div className="rename-row">
                <input
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  autoFocus
                />
                <button className="btn btn-sm btn-primary" onClick={() => handleRename(col.id)}>Save</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setRenaming(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <Link to={`/collections/${col.id}`} className="list-card-name">
                  {col.name}
                </Link>
                <div className="list-card-meta">
                  {col.cards.length} card{col.cards.length !== 1 ? 's' : ''}
                </div>
                <div className="list-card-actions">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => { setRenaming(col.id); setRenameVal(col.name); }}
                  >
                    Rename
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteCollection(col.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
