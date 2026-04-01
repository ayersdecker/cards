import * as XLSX from 'xlsx';
import { getStorageRec, mapColors } from './scryfall';
import type { Collection, Deck } from '../types';

function buildRows(cards: Array<{ name: string; set_name: string; price: string | null; colors: string[] }>) {
  return cards.map((c) => ({
    'Card Name': c.name,
    'Most Recent Set': c.set_name,
    'Price (USD)': c.price ? `$${c.price}` : 'N/A',
    Color: mapColors(c.colors),
    'Storage Recommendation': getStorageRec(c.price),
  }));
}

export function exportCollection(collection: Collection): void {
  const rows = buildRows(collection.cards);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Collection');
  XLSX.writeFile(wb, `${collection.name}.xlsx`);
}

export function exportDeck(deck: Deck): void {
  const rows = buildRows(deck.cards);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Deck');
  XLSX.writeFile(wb, `${deck.name}.xlsx`);
}
