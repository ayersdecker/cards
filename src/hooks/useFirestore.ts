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
import type { Collection, Deck } from '../types';

function sanitizeFirestoreValue(value: unknown): unknown {
  if (value === undefined) return undefined;

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeFirestoreValue(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      const sanitized = sanitizeFirestoreValue(entryValue);
      if (sanitized !== undefined) {
        next[key] = sanitized;
      }
    }
    return next;
  }

  return value;
}

export function useCollections(uid: string | null) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setCollections([]); setLoading(false); return; }
    const colRef = collection(db, 'users', uid, 'collections');
    const unsub = onSnapshot(query(colRef), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Collection));
      setCollections(data);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const createCollection = async (name: string) => {
    if (!uid) return;
    const ref = doc(collection(db, 'users', uid, 'collections'));
    await setDoc(ref, { name, cards: [], createdAt: Date.now(), updatedAt: Date.now() });
  };

  const updateCollection = async (colId: string, data: Partial<Collection>) => {
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'collections', colId);
    const sanitized = sanitizeFirestoreValue({ ...data, updatedAt: Date.now() }) as Record<string, unknown>;
    await updateDoc(ref, sanitized);
  };

  const deleteCollection = async (colId: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'collections', colId));
  };

  return { collections, loading, createCollection, updateCollection, deleteCollection };
}

export function useDecks(uid: string | null) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setDecks([]); setLoading(false); return; }
    const colRef = collection(db, 'users', uid, 'decks');
    const unsub = onSnapshot(query(colRef), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Deck));
      setDecks(data);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const createDeck = async (name: string) => {
    if (!uid) return;
    const ref = doc(collection(db, 'users', uid, 'decks'));
    await setDoc(ref, { name, isCommander: false, commanderCardId: null, cards: [], createdAt: Date.now(), updatedAt: Date.now() });
  };

  const updateDeck = async (deckId: string, data: Partial<Deck>) => {
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'decks', deckId);
    const sanitized = sanitizeFirestoreValue({ ...data, updatedAt: Date.now() }) as Record<string, unknown>;
    await updateDoc(ref, sanitized);
  };

  const deleteDeck = async (deckId: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'decks', deckId));
  };

  return { decks, loading, createDeck, updateDeck, deleteDeck };
}
