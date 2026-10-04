import type { Deck, DeckCard } from '../src/types';

export const card: DeckCard = {
  scryfallId: 'sol-ring',
  name: 'Sol Ring',
  set: 'cmm',
  set_name: 'Commander Masters',
  quantity: 1,
  price: '1.00',
  colors: [],
  imageUri: 'https://cards.scryfall.io/example.jpg',
  cmc: 1,
  type_line: 'Artifact',
  isSideboard: false,
  collectedQuantity: 1,
  proxyQueuedQuantity: 2,
};

export const deck: Deck = {
  id: 'deck-one',
  name: 'Test brew',
  isCommander: true,
  commanderCardId: 'commander',
  createdAt: 100,
  updatedAt: 200,
  cards: [
    { ...card, scryfallId: 'commander', name: 'Alela, Artful Provocateur', cmc: 4 },
    card,
    { ...card, scryfallId: 'island', name: 'Island', quantity: 8, cmc: 0 },
    { ...card, scryfallId: 'split', name: 'Wear // Tear' },
    { ...card, isSideboard: true, quantity: 2 },
  ],
};
