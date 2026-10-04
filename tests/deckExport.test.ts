import { describe, expect, it } from 'vitest';
import { formatDeckText } from '../src/services/deckExport';
import { isSharedDeck, toSharedDeck } from '../src/services/deckSharing';
import { deck } from './fixtures';

describe('decklist text exports', () => {
  it('exports Archidekt quantities and per-card zones without private metadata', () => {
    expect(formatDeckText(deck, 'archidekt')).toBe(
      '1 Alela, Artful Provocateur `Commander`\n' +
      '1 Sol Ring\n8 Island\n1 Wear // Tear\n2 Sol Ring `Sideboard`\n',
    );
  });

  it('exports Moxfield sections and keeps the commander out of the main list', () => {
    expect(formatDeckText(deck, 'moxfield')).toBe(
      'Commander\n1 Alela, Artful Provocateur\n\n' +
      'Deck\n1 Sol Ring\n8 Island\n1 Wear // Tear\n\nSideboard\n2 Sol Ring\n',
    );
  });

  it('does not mark a stale commander when Commander mode is off', () => {
    const text = formatDeckText({ ...deck, isCommander: false }, 'moxfield');
    expect(text).not.toContain('Commander');
    expect(text).toContain('Deck\n1 Alela, Artful Provocateur\n');
  });

  it('preserves all cards when the commander is missing or only in the sideboard', () => {
    for (const commanderCardId of ['missing', 'side-only', null]) {
      const text = formatDeckText({ ...deck, commanderCardId }, 'moxfield');
      expect(text).not.toContain('Commander');
      expect(text).toContain('1 Alela, Artful Provocateur');
    }
    const sideOnly = { ...deck, cards: deck.cards.map((card) => ({ ...card, isSideboard: true })) };
    expect(formatDeckText(sideOnly, 'archidekt')).not.toContain('`Commander`');
  });

  it('handles empty lists and lists without a sideboard', () => {
    expect(formatDeckText({ ...deck, cards: [] }, 'archidekt')).toBe('');
    expect(formatDeckText({ ...deck, cards: [] }, 'moxfield')).toBe('');
    const mainOnly = { ...deck, cards: deck.cards.filter((card) => !card.isSideboard) };
    expect(formatDeckText(mainOnly, 'moxfield')).not.toContain('Sideboard');
  });

  it('exports the same decklist from the read-only public representation', () => {
    for (const format of ['archidekt', 'moxfield'] as const) {
      expect(formatDeckText(toSharedDeck(deck, 'owner'), format)).toBe(formatDeckText(deck, format));
    }
  });
});

describe('public deck projection', () => {
  it('whitelists decklist fields and omits ownership, queue, account, and pricing data', () => {
    const shared = toSharedDeck({ ...deck, shareId: 'private-share-token' }, 'owner');
    expect(Object.keys(shared).sort()).toEqual([
      'cards', 'commanderCardId', 'deckId', 'isCommander', 'name', 'ownerId', 'updatedAt',
    ]);
    expect(Object.keys(shared.cards[0]).sort()).toEqual([
      'cmc', 'imageUri', 'isSideboard', 'mana_cost', 'name', 'quantity', 'scryfallId', 'type_line',
    ]);
    expect(JSON.stringify(shared)).not.toMatch(/collectedQuantity|proxyQueuedQuantity|price|shareId|email/);
    expect(shared.cards.reduce((sum, card) => sum + card.quantity, 0)).toBe(13);
  });

  it('normalizes optional fields without mutating the original deck', () => {
    const shared = toSharedDeck({ ...deck, isCommander: undefined, commanderCardId: undefined }, 'owner');
    expect(shared.isCommander).toBe(false);
    expect(shared.commanderCardId).toBeNull();
    expect(shared.cards[0].mana_cost).toBe('');
    expect(deck.cards[0].mana_cost).toBeUndefined();
  });

  it('validates public data before rendering it', () => {
    const shared = toSharedDeck(deck, 'owner');
    expect(isSharedDeck(shared)).toBe(true);
    for (const invalid of [
      null,
      { ...shared, cards: [null] },
      { ...shared, updatedAt: NaN },
      { ...shared, cards: [{ ...shared.cards[0], quantity: -1 }] },
      { ...shared, cards: [{ ...shared.cards[0], name: null }] },
    ]) {
      expect(isSharedDeck(invalid)).toBe(false);
    }
  });
});
