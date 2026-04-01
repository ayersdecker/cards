import writeXlsxFile from 'write-excel-file/browser';
import type { Schema } from 'write-excel-file/browser';
import { mapColors } from './scryfall';
import { DEFAULT_STORAGE_SETTINGS, getStorageRec, type StorageSettings } from './storageSettings';
import type { Collection, Deck } from '../types';

type BaseCardRow = {
  name: string;
  set?: string;
  set_name: string;
  price: string | null;
  colors: string[];
  quantity: number;
  scryfallId: string;
  imageUri: string;
};

type CollectionCardRow = BaseCardRow & {
  addedAt: number;
};

type DeckCardRow = BaseCardRow & {
  cmc: number;
  type_line: string;
  mana_cost?: string;
  isSideboard: boolean;
};

const COLLECTION_SCHEMA: Schema<CollectionCardRow> = [
  { column: 'Card Name', type: String, value: (c) => c.name },
  { column: 'Quantity', type: Number, value: (c) => c.quantity },
  { column: 'Most Recent Set', type: String, value: (c) => c.set_name },
  { column: 'Price (USD)', type: String, value: (c) => (c.price ? `$${c.price}` : 'N/A') },
  {
    column: 'Total Value (USD)',
    type: Number,
    value: (c) => (parseFloat(c.price ?? '0') || 0) * c.quantity,
  },
  { column: 'Color', type: String, value: (c) => mapColors(c.colors) },
  {
    column: 'Storage Recommendation',
    type: String,
    value: (c) => getStorageRec(c, DEFAULT_STORAGE_SETTINGS),
  },
  { column: 'Scryfall ID', type: String, value: (c) => c.scryfallId },
  { column: 'Image URL', type: String, value: (c) => c.imageUri || 'N/A' },
  {
    column: 'Date Added',
    type: String,
    value: (c) => (c.addedAt ? new Date(c.addedAt).toISOString() : 'N/A'),
  },
];

const DECK_SCHEMA: Schema<DeckCardRow> = [
  { column: 'Card Name', type: String, value: (c) => c.name },
  { column: 'Quantity', type: Number, value: (c) => c.quantity },
  { column: 'Section', type: String, value: (c) => (c.isSideboard ? 'Sideboard' : 'Main Deck') },
  { column: 'Most Recent Set', type: String, value: (c) => c.set_name },
  { column: 'Price (USD)', type: String, value: (c) => (c.price ? `$${c.price}` : 'N/A') },
  {
    column: 'Total Value (USD)',
    type: Number,
    value: (c) => (parseFloat(c.price ?? '0') || 0) * c.quantity,
  },
  { column: 'Color', type: String, value: (c) => mapColors(c.colors) },
  { column: 'CMC', type: Number, value: (c) => c.cmc },
  { column: 'Mana Cost', type: String, value: (c) => c.mana_cost ?? '' },
  { column: 'Type Line', type: String, value: (c) => c.type_line },
  {
    column: 'Storage Recommendation',
    type: String,
    value: (c) => getStorageRec(c, DEFAULT_STORAGE_SETTINGS),
  },
  { column: 'Scryfall ID', type: String, value: (c) => c.scryfallId },
  { column: 'Image URL', type: String, value: (c) => c.imageUri || 'N/A' },
];

export async function exportCollection(
  collection: Collection,
  settings: StorageSettings = DEFAULT_STORAGE_SETTINGS
): Promise<void> {
  await writeXlsxFile(collection.cards as CollectionCardRow[], {
    schema: COLLECTION_SCHEMA.map((column) => {
      if (column.column !== 'Storage Recommendation') return column;
      return {
        ...column,
        value: (c: CollectionCardRow) => getStorageRec(c, settings),
      };
    }) as Schema<CollectionCardRow>,
    fileName: `${collection.name}.xlsx`,
  });
}

export async function exportDeck(
  deck: Deck,
  settings: StorageSettings = DEFAULT_STORAGE_SETTINGS
): Promise<void> {
  await writeXlsxFile(deck.cards as DeckCardRow[], {
    schema: DECK_SCHEMA.map((column) => {
      if (column.column !== 'Storage Recommendation') return column;
      return {
        ...column,
        value: (c: DeckCardRow) => getStorageRec(c, settings),
      };
    }) as Schema<DeckCardRow>,
    fileName: `${deck.name}.xlsx`,
  });
}
