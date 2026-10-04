import type { DeckCard } from '../types';

export type DeckTextFormat = 'archidekt' | 'moxfield';

export interface ExportableDeck {
  name: string;
  isCommander?: boolean;
  commanderCardId?: string | null;
  cards: Pick<DeckCard, 'scryfallId' | 'name' | 'quantity' | 'isSideboard'>[];
}

export function formatDeckText(deck: ExportableDeck, format: DeckTextFormat): string {
  if (!deck.cards.length) return '';
  const commander = deck.isCommander
    ? deck.cards.find((card) => !card.isSideboard && card.scryfallId === deck.commanderCardId)
    : undefined;
  const main = deck.cards.filter((card) => !card.isSideboard && card !== commander);
  const side = deck.cards.filter((card) => card.isSideboard);
  const line = (card: ExportableDeck['cards'][number]) => `${card.quantity} ${card.name}`;

  if (format === 'archidekt') {
    return [
      ...(commander ? [`${line(commander)} \`Commander\``] : []),
      ...main.map(line),
      ...side.map((card) => `${line(card)} \`Sideboard\``),
    ].join('\n') + '\n';
  }

  return [
    ...(commander ? [`Commander\n${line(commander)}`] : []),
    `Deck${main.length ? `\n${main.map(line).join('\n')}` : ''}`,
    ...(side.length ? [`Sideboard\n${side.map(line).join('\n')}`] : []),
  ].join('\n\n') + '\n';
}

export function downloadDeckText(deck: ExportableDeck, format: DeckTextFormat): void {
  const blob = new Blob([formatDeckText(deck, format)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${deck.name.replace(/[/\\:*?"<>|]/g, '-').trim() || 'deck'}-${format}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
