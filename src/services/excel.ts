import writeXlsxFile from 'write-excel-file/browser';
import type { Schema } from 'write-excel-file/browser';
import { getStorageRec, mapColors } from './scryfall';
import type { Collection, Deck } from '../types';

type CardRow = {
  name: string;
  set_name: string;
  price: string | null;
  colors: string[];
};

const SCHEMA: Schema<CardRow> = [
  { column: 'Card Name', type: String, value: (c: CardRow) => c.name },
  { column: 'Most Recent Set', type: String, value: (c: CardRow) => c.set_name },
  { column: 'Price (USD)', type: String, value: (c: CardRow) => (c.price ? `$${c.price}` : 'N/A') },
  { column: 'Color', type: String, value: (c: CardRow) => mapColors(c.colors) },
  { column: 'Storage Recommendation', type: String, value: (c: CardRow) => getStorageRec(c.price) },
];

export async function exportCollection(collection: Collection): Promise<void> {
  await writeXlsxFile(collection.cards as CardRow[], { schema: SCHEMA, fileName: `${collection.name}.xlsx` });
}

export async function exportDeck(deck: Deck): Promise<void> {
  await writeXlsxFile(deck.cards as CardRow[], { schema: SCHEMA, fileName: `${deck.name}.xlsx` });
}
