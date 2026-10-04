# Redtail Cards

Redtail Cards is a modern MTG collection and deck companion built for players who want speed, clarity, and powerful print workflows in one place.

Track your cards. Build tighter decks. Queue missing cards as proxies. Print clean sheets that are ready to cut.

## What Is Redtail Cards?

Redtail Cards is a web app designed for collectors, deck brewers, and playgroups that move fast. It combines collection management, deck construction, and proxy printing into a single workflow so you can spend less time organizing and more time playing.

## Core Features

- Search and explore MTG cards with rich card data
- Build and manage unlimited collections
- Build decks with quantity tracking, sideboard support, and commander tools
- Check cards against collection ownership while building decks
- Queue missing cards as proxies directly from decks or collections
- Print proxy sheets with multiple density modes and cut-friendly layouts
- Bulk import card lists into collections/decks
- Export deck and collection data to XLSX
- Export or copy decklists as Archidekt or Moxfield text, with commander and sideboard markers
- Enable live, read-only deck links that friends can open without an account; revoke them at any time
- Read three public deck-building guides: Commander foundations, 60-card consistency, and budget playtesting

## Deck Exports and Sharing

Open a deck under Collections to find **Export decklist** and **Share your deck**.
Choose Archidekt or Moxfield, then download a TXT file or copy the list into that site's
text importer. Exports use card names and quantities, not exact printings. Verify commander
assignment, board placement, and format legality after importing. XLSX export is still available.

Decks remain private unless you enable a share link. The `/shared/decks/:shareId` page is
read-only, requires no viewer account, and updates as the owner edits the deck. Sharing publishes
only decklist data in `sharedDecks`; it does not expose collections, email, ownership check-offs,
or proxy queues. Public collection queries are denied. Turning sharing off or deleting a deck
removes its shared document atomically. Re-enabling sharing generates a new link. Anyone with a
link can forward it or save an export; revocation cannot erase those saved copies.

**Deployment requirement:** Deploy the updated `firestore.rules` to the app's Firebase project
alongside the frontend. The previous owner-only rules do not allow shared deck reads or writes.
Use the Firebase Console's Firestore Rules tab to publish this file, or your existing Firebase
CLI deployment workflow. GitHub Pages deployment builds the frontend only; it does not deploy
Firestore rules. Do not enable sharing in an old frontend deployment that does not synchronize
the public document on deck edits.

The `/guides` index and three individual guide pages are public and included in the sitemap.

## Validation

- `npm test`: text export, privacy projection, guide rendering, and export-control tests.
- `npm run build`: TypeScript checking and production build.
- `npx firebase-tools@14 emulators:exec --project demo-cards --only firestore "npm run test:rules"`:
  Firestore rule and sharing lifecycle tests, including anonymous reads, denied writes, live updates,
  revocation, deletion, and atomic publication failures. Requires Java 21+ and uses a demo project,
  not the production database.

Deck changes and sharing transactions require a network connection. A share link is not a version
snapshot; use a TXT export when you want to preserve a particular revision.

## Why Players Use It

- Fast setup for new brews and test sessions
- One source of truth for owned vs needed cards
- Cleaner proxy prep for casual nights and testing leagues
- Flexible layout options for different printers and cutting preferences

## Product Highlights

### Collection + Deck Workflow

Build from what you own. As you edit a deck, Redtail Cards helps you identify what is already in your collection and what still needs to be proxied.

### Proxy Queue Engine

Queue proxy cards from any deck or collection source. Print from a unified queue hub with consistent standard-size card output.

### Print Modes

- Compact: maximize cards per page
- Balanced: practical spacing for most use cases
- Loose: extra spacing and cut guidance for easier trimming

All print modes keep standard card sizing so proxies stay consistent.

## Built For

- MTG players testing new deck ideas quickly
- Commander groups sharing proxy-ready lists
- Collectors who want portfolio and inventory visibility
- Anyone who wants cleaner card organization with less manual overhead

## Vision

Redtail Cards aims to be the fastest way to go from idea to table:

Discover -> Track -> Build -> Queue -> Print -> Play
