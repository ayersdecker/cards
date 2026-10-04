import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { updateStoredDeck, setStoredDeckSharing, deleteStoredDeck } from '../services/deckSharing';
import { sanitizeFirestoreValue } from '../services/firestoreValues';
import type { Collection, Deck } from '../types';

export function useCollections(uid: string | null) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !db) { setCollections([]); setLoading(false); return; }
    const colRef = collection(db, 'users', uid, 'collections');
    const unsub = onSnapshot(query(colRef), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Collection));
      setCollections(data);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const createCollection = async (name: string) => {
    if (!uid || !db) return undefined;
    const ref = doc(collection(db, 'users', uid, 'collections'));
    await setDoc(ref, { name, cards: [], createdAt: Date.now(), updatedAt: Date.now() });
    return ref.id;
  };

  const updateCollection = async (colId: string, data: Partial<Collection>) => {
    if (!uid || !db) return;
    const ref = doc(db, 'users', uid, 'collections', colId);
    const sanitized = sanitizeFirestoreValue({ ...data, updatedAt: Date.now() }) as Record<string, unknown>;
    await updateDoc(ref, sanitized);
  };

  const deleteCollection = async (colId: string) => {
    if (!uid || !db) return;
    await deleteDoc(doc(db, 'users', uid, 'collections', colId));
  };

  return { collections, loading, createCollection, updateCollection, deleteCollection };
}

export function useDecks(uid: string | null) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid || !db) { setDecks([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    setDecks([]);
    const colRef = collection(db, 'users', uid, 'decks');
    const unsub = onSnapshot(query(colRef), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Deck));
      setDecks(data);
      setLoading(false);
    }, (err) => {
      setError(`Unable to load decks: ${err.message}`);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const createDeck = async (name: string, options?: { isCommander?: boolean }) => {
    if (!uid || !db) return undefined;
    const ref = doc(collection(db, 'users', uid, 'decks'));
    await setDoc(ref, {
      name,
      isCommander: options?.isCommander ?? false,
      commanderCardId: null,
      cards: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return ref.id;
  };

  const updateDeck = async (deckId: string, data: Partial<Deck>) => {
    await updateStoredDeck(db, uid, deckId, data);
  };

  const setDeckSharing = async (deckId: string, enabled: boolean) => {
    return setStoredDeckSharing(db, uid, deckId, enabled);
  };

  const deleteDeck = async (deckId: string) => {
    await deleteStoredDeck(db, uid, deckId);
  };

  return { decks, loading, error, createDeck, updateDeck, deleteDeck, setDeckSharing };
}
