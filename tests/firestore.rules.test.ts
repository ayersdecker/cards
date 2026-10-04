import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { deleteStoredDeck, setStoredDeckSharing, toSharedDeck, updateStoredDeck } from '../src/services/deckSharing';
import { card, deck } from './fixtures';

let environment: RulesTestEnvironment;

beforeAll(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('Start the Firestore emulator to run rules tests. See README.md.');
  }
  environment = await initializeTestEnvironment({
    projectId: 'demo-cards',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await setDoc(doc(environment.authenticatedContext('owner').firestore(), 'users/owner/decks/deck-one'), deck);
});

afterAll(async () => {
  if (environment) await environment.cleanup();
});

describe('shared deck lifecycle and rules', () => {
  it('keeps private decks and collections owner-only and prevents shared deck enumeration', async () => {
    const owner = environment.authenticatedContext('owner').firestore();
    const anonymous = environment.unauthenticatedContext().firestore();
    const stranger = environment.authenticatedContext('stranger').firestore();
    await assertSucceeds(getDoc(doc(owner, 'users/owner/decks/deck-one')));
    await assertFails(getDoc(doc(anonymous, 'users/owner/decks/deck-one')));
    await assertFails(getDoc(doc(stranger, 'users/owner/decks/deck-one')));
    await assertFails(getDocs(collection(anonymous, 'users/owner/collections')));
    await assertFails(getDocs(collection(anonymous, 'sharedDecks')));
    await assertFails(getDocs(collection(owner, 'sharedDecks')));
  });

  it('publishes a sanitized deck for anonymous viewers and keeps edits live', async () => {
    const owner = environment.authenticatedContext('owner').firestore();
    const anonymous = environment.unauthenticatedContext().firestore();
    const shareId = await setStoredDeckSharing(owner, 'owner', deck.id, true);
    expect(shareId).toBeTruthy();
    const publicRef = doc(anonymous, 'sharedDecks', shareId!);
    expect((await getDoc(publicRef)).data()).toEqual(toSharedDeck({
      ...deck, updatedAt: expect.any(Number),
    }, 'owner'));

    const liveUpdate = new Promise<void>((resolve, reject) => {
      const unsubscribe = onSnapshot(publicRef, (snapshot) => {
        if (snapshot.data()?.name === 'Updated brew') {
          unsubscribe();
          resolve();
        }
      }, reject);
    });
    await updateStoredDeck(owner, 'owner', deck.id, {
      name: 'Updated brew',
      cards: [...deck.cards, { ...card, scryfallId: 'new-card', name: 'Arcane Signet' }],
      commanderCardId: undefined,
    });
    await liveUpdate;
    const shared = (await getDoc(publicRef)).data()!;
    expect(shared.name).toBe('Updated brew');
    expect(shared.cards).toHaveLength(6);
    expect(shared.commanderCardId).toBeNull();
    expect(shared.cards.every((row: Record<string, unknown>) => !('collectedQuantity' in row) && !('proxyQueuedQuantity' in row))).toBe(true);
    expect((await getDoc(doc(owner, 'users/owner/decks/deck-one'))).data()?.commanderCardId).toBeNull();
  });

  it('denies anonymous and other-account writes and deletion', async () => {
    const owner = environment.authenticatedContext('owner').firestore();
    const shareId = await setStoredDeckSharing(owner, 'owner', deck.id, true);
    for (const viewer of [environment.unauthenticatedContext(), environment.authenticatedContext('stranger')]) {
      const publicRef = doc(viewer.firestore(), 'sharedDecks', shareId!);
      await assertSucceeds(getDoc(publicRef));
      await assertFails(updateDoc(publicRef, { name: 'Hijacked' }));
      await assertFails(deleteDoc(publicRef));
    }
  });

  it('revokes old links and creates a different token when re-enabled', async () => {
    const owner = environment.authenticatedContext('owner').firestore();
    const anonymous = environment.unauthenticatedContext().firestore();
    const first = await setStoredDeckSharing(owner, 'owner', deck.id, true);
    await setStoredDeckSharing(owner, 'owner', deck.id, false);
    expect((await getDoc(doc(anonymous, 'sharedDecks', first!))).exists()).toBe(false);
    await updateStoredDeck(owner, 'owner', deck.id, { name: 'Still private' });
    expect((await getDoc(doc(anonymous, 'sharedDecks', first!))).exists()).toBe(false);
    const second = await setStoredDeckSharing(owner, 'owner', deck.id, true);
    expect(second).not.toBe(first);
    expect((await getDoc(doc(anonymous, 'sharedDecks', second!))).data()?.name).toBe('Still private');
  });

  it('deletes the private deck and shared list together', async () => {
    const owner = environment.authenticatedContext('owner').firestore();
    const shareId = await setStoredDeckSharing(owner, 'owner', deck.id, true);
    await deleteStoredDeck(owner, 'owner', deck.id);
    expect((await getDoc(doc(owner, 'users/owner/decks/deck-one'))).exists()).toBe(false);
    expect((await getDoc(doc(environment.unauthenticatedContext().firestore(), 'sharedDecks', shareId!))).exists()).toBe(false);
  });

  it('does not publish private deck updates unless sharing is enabled', async () => {
    const owner = environment.authenticatedContext('owner').firestore();
    await updateStoredDeck(owner, 'owner', deck.id, { name: 'Private edit' });
    expect((await getDoc(doc(owner, 'users/owner/decks/deck-one'))).data()?.name).toBe('Private edit');
    await environment.withSecurityRulesDisabled(async (context) => {
      expect((await getDocs(collection(context.firestore(), 'sharedDecks'))).empty).toBe(true);
    });
  });

  it('rejects orphan publications and account fields in public documents', async () => {
    const owner = environment.authenticatedContext('owner').firestore();
    const shared = toSharedDeck(deck, 'owner');
    await assertFails(setDoc(doc(owner, 'sharedDecks/orphan'), shared));
    const batch = writeBatch(owner);
    batch.update(doc(owner, 'users/owner/decks/deck-one'), { shareId: 'invalid' });
    batch.set(doc(owner, 'sharedDecks/invalid'), { ...shared, email: 'not-for-publication' });
    await assertFails(batch.commit());
    expect((await getDoc(doc(owner, 'users/owner/decks/deck-one'))).data()?.shareId).toBeUndefined();
  });

  it('rejects signed-out saves and missing decks explicitly', async () => {
    const owner = environment.authenticatedContext('owner').firestore();
    await expect(updateStoredDeck(owner, null, deck.id, {})).rejects.toThrow('Sign in');
    await expect(deleteStoredDeck(owner, null, deck.id)).rejects.toThrow('Sign in');
    await expect(updateStoredDeck(owner, 'owner', 'missing', {})).rejects.toThrow('Deck not found');
  });
});
