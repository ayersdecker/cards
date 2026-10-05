import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GuidesPage, { GuidePage } from '../src/components/Guides/GuidesPage';
import DeckExportControls from '../src/components/Decks/DeckExportControls';
import { deck } from './fixtures';

function renderGuide(path: string) {
  return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/guides" element={<GuidesPage />} />
      <Route path="/guides/:slug" element={<GuidePage />} />
    </Routes>
  </MemoryRouter>);
}

describe('public guides', () => {
  it('offers exactly three linked guides without requiring an auth provider', () => {
    const html = renderGuide('/guides');
    expect(html.match(/class="guide-card"/g)).toHaveLength(3);
    expect(html).toContain('/guides/commander-foundations');
    expect(html).toContain('/guides/sixty-card-consistency');
    expect(html).toContain('/guides/budget-and-playtesting');
    expect(html.match(/class="guide-card-art"/g)).toHaveLength(3);
    expect(html).toContain('THE REDTAIL FIELD GUIDE');
    expect(html).toContain('A good idea deserves a first draft.');
  });

  it.each([
    ['commander-foundations', 'Give the 99 a working skeleton'],
    ['sixty-card-consistency', 'Treat the sideboard as a set of swaps'],
    ['budget-and-playtesting', 'Keep notes that can change a decision'],
  ])('renders the full %s guide with actionable content', (slug, heading) => {
    const html = renderGuide(`/guides/${slug}`);
    expect(html).toContain(heading);
    expect(html.match(/<section(?:\s|>)/g)?.length).toBeGreaterThanOrEqual(6);
    expect(html).toContain('href="/collections"');
    expect(html).toContain('Back to all guides');
    expect(html.match(/class="guide-figure"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="In this guide"');
    expect(html).toContain('YOUR READING PATH');
  });

  it('provides a helpful unavailable-guide page', () => {
    const html = renderGuide('/guides/not-a-guide');
    expect(html).toContain('Guide not found');
    expect(html).toContain('Browse all guides');
  });
});

describe('export controls', () => {
  it('keeps XLSX available to owners and hides it for shared viewers', () => {
    const owner = renderToStaticMarkup(<DeckExportControls deck={deck} onXlsx={async () => {}} />);
    const viewer = renderToStaticMarkup(<DeckExportControls deck={deck} />);
    expect(owner).toContain('Export XLSX');
    expect(viewer).not.toContain('Export XLSX');
    for (const html of [owner, viewer]) {
      expect(html).toContain('Archidekt');
      expect(html).toContain('Moxfield');
      expect(html).toContain('Download TXT');
      expect(html).toContain('Copy decklist');
    }
  });
});
