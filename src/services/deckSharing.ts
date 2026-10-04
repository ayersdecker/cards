import { collection, doc, runTransaction, type Firestore } from 'firebase/firestore';
import type { Deck, SharedDeck } from '../types';
import { sanitizeFirestoreValue } from './firestoreValues';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isSharedDeck(value: unknown): value is SharedDeck {
  if (!isRecord(value)) return false;
  return typeof value.ownerId === 'string'
    && typeof value.deckId === 'string'
    && typeof value.name === 'string'
    && typeof value.isCommander === 'boolean'
    && (value.commanderCardId === null || typeof value.commanderCardId === 'string')
    && typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
    && Array.isArray(value.cards)
    && value.cards.every((card: unknown) => isRecord(card)
      && typeof card.scryfallId === 'string'
      && typeof card.name === 'string'
      && typeof card.quantity === 'number' && Number.isInteger(card.quantity) && card.quantity > 0
      && typeof card.isSideboard === 'boolean'
      && typeof card.imageUri === 'string'
      && typeof card.type_line === 'string'
      && typeof card.mana_cost === 'string'
      && typeof card.cmc === 'number' && Number.isFinite(card.cmc));
}

export function toSharedDeck(deck: Deck, ownerId: string): SharedDeck {
  return {
    ownerId,
    deckId: deck.id,
    name: deck.name,
    isCommander: deck.isCommander ?? false,
    commanderCardId: deck.commanderCardId ?? null,
    updatedAt: deck.updatedAt,
    cards: deck.cards.map((card) => ({
      scryfallId: card.scryfallId,
      name: card.name,
      quantity: card.quantity,
      isSideboard: card.isSideboard,
      imageUri: card.imageUri,
      type_line: card.type_line,
      mana_cost: card.mana_cost ?? '',
      cmc: card.cmc,
    })),
  };
}

export async function updateStoredDeck(db: Firestore, uid: string | null, deckId: string, data: Partial<Deck>): Promise<void> {
  if (!uid) throw new Error('Sign in to update a deck.');
  const ref = doc(db, 'users', uid, 'decks', deckId);
  const patch = {
    ...data,
    ...('commanderCardId' in data ? { commanderCardId: data.commanderCardId ?? null } : {}),
    updatedAt: Date.now(),
  };
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Deck not found.');
    const current = { ...snapshot.data(), id: snapshot.id } as Deck;
    const next = { ...current, ...patch };
    transaction.update(ref, sanitizeFirestoreValue(patch) as Record<string, unknown>);
    if (current.shareId && current.shareId !== next.shareId) {
      transaction.delete(doc(db, 'sharedDecks', current.shareId));
    }
    if (next.shareId) {
      transaction.set(doc(db, 'sharedDecks', next.shareId), toSharedDeck(next, uid));
    }
  });
}

export async function setStoredDeckSharing(db: Firestore, uid: string | null, deckId: string, enabled: boolean): Promise<string | null> {
  const shareId = enabled ? doc(collection(db, 'sharedDecks')).id : null;
  await updateStoredDeck(db, uid, deckId, { shareId });
  return shareId;
}

export async function deleteStoredDeck(db: Firestore, uid: string | null, deckId: string): Promise<void> {
  if (!uid) throw new Error('Sign in to delete a deck.');
  const ref = doc(db, 'users', uid, 'decks', deckId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Deck not found.');
    const deck = snapshot.data() as Deck;
    if (deck.shareId) transaction.delete(doc(db, 'sharedDecks', deck.shareId));
    transaction.delete(ref);
  });
}
