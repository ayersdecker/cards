import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { InfoPage } from '../InfoPages';

const guides = [
  {
    slug: 'commander-foundations',
    title: 'Build a Commander deck with a clear plan',
    description: 'Choose a commander, balance your 99, and build a mana base that supports your strategy.',
    readTime: '7-minute read',
  },
  {
    slug: 'sixty-card-consistency',
    title: 'Make your 60-card deck more consistent',
    description: 'Turn an idea into a focused list with a sensible curve, reliable mana, and a purposeful sideboard.',
    readTime: '6-minute read',
  },
  {
    slug: 'budget-and-playtesting',
    title: 'Build on a budget and improve through playtesting',
    description: 'Start with your collection, test before buying, and use real game notes to make better cuts.',
    readTime: '6-minute read',
  },
];

export default function GuidesPage() {
  return (
    <InfoPage title="Deck-building guides" description="Three practical Magic: The Gathering guides to take your next deck from an idea to a focused, tested list. No account needed.">
      <section>
        <h2>A better deck starts with a plan</h2>
        <p>You do not need an expensive collection or a perfect first draft. Start with a strategy,
          give your deck enough mana and interaction, and improve one decision at a time. These guides
          explain both the reasoning and a workflow you can use in Redtail Cards.</p>
      </section>
      <div className="guides-grid">
        {guides.map((guide, index) => <article key={guide.slug} className="guide-card">
          <p className="info-page-kicker">GUIDE {index + 1} / {guide.readTime}</p>
          <h2><Link to={`/guides/${guide.slug}`}>{guide.title}</Link></h2>
          <p>{guide.description}</p>
          <Link className="btn btn-outline" to={`/guides/${guide.slug}`}>Read guide</Link>
        </article>)}
      </div>
      <section>
        <h2>Before you start</h2>
        <p>Choose a format and check its current rules and banned list. A saved list is not a legality
          certification. Redtail Cards helps with card research and deck organization; format legality,
          special deck-building exceptions, and your playgroup's expectations still need your review.</p>
        <p><Link to="/search">Explore cards without signing in</Link>, or <Link to="/collections">sign in to create a deck</Link>.</p>
      </section>
    </InfoPage>
  );
}

function CommanderGuide() {
  return <>
    <section>
      <h2>1. Choose a commander and a one-sentence strategy</h2>
      <p>Commander normally uses exactly 100 cards, including your commander, with singleton rules
        except for basic lands and cards that explicitly allow additional copies. Your commander
        determines the deck's color identity. Color identity is not just the mana cost: rules-text
        mana symbols and the other face of a double-faced card can matter too.</p>
      <p>Write a sentence such as "Make creature tokens, then turn a wide board into a finishing attack."
        That sentence gives every card a job. A powerful card that does not help the plan, provide mana,
        draw cards, or answer a problem is a candidate for a cut. Special commander combinations have
        their own rules; check them before designing around multiple commanders.</p>
    </section>
    <section>
      <h2>2. Give the 99 a working skeleton</h2>
      <p>For a first draft with one commander, try this starting allocation. It is a planning exercise,
        not a requirement, and an unusually low or high mana curve will need adjustments.</p>
      <ul>
        <li>37 lands to make early land drops.</li>
        <li>10 ramp cards to accelerate or fix your mana.</li>
        <li>10 card-advantage cards to avoid running out of decisions.</li>
        <li>10 targeted answers for creatures and other important permanents.</li>
        <li>3 board wipes for positions that targeted removal cannot fix.</li>
        <li>5 protection or recovery cards to keep your plan alive.</li>
        <li>24 theme and finishing cards that actually advance your strategy.</li>
      </ul>
      <p>Those slots total 99. Add your commander for 100. Many cards fill several roles, but count each
        card once under its primary job while planning. Otherwise a list can look like it has ten draw
        spells when several only draw in situations you rarely create.</p>
    </section>
    <section>
      <h2>3. Build mana for the turns you want to play</h2>
      <p>A turn-two ramp spell helps only if you can produce its colors on turn two. Compare your
        early colored requirements with your available sources, not just the number of colored cards
        in the deck. Lands that enter tapped are useful budget tools, but too many can leave you a turn
        behind. Colorless utility lands also compete with the colored sources you need.</p>
      <p>Keep a mix of cheap setup, midgame engines, and a few finishers. If your first meaningful play
        regularly happens on turn five, lower the curve before adding more spectacular seven-mana
        spells. Ramp supports a reasonable curve; it does not automatically repair a top-heavy deck.</p>
    </section>
    <section>
      <h2>4. Make the deck work without its commander</h2>
      <p>Ask what happens after your commander is removed twice. Include backup enablers, independent
        card draw, and a way to rebuild. An interaction package should answer more than creatures:
        consider artifacts, enchantments, graveyards, and dangerous engines in your group.</p>
      <p>Before playing, discuss expected power, fast mana, combos, and proxy acceptance with your
        table. A deck that is technically legal can still be a poor match for a casual group.</p>
    </section>
    <section>
      <h2>Try it in Redtail Cards</h2>
      <ol>
        <li>Create a Commander deck in Collections and add your commander.</li>
        <li>Use "Set Cmdr" on that main-deck card, then add cards within its color identity.</li>
        <li>Review the mana curve and card count. The commander is already included in the main total.</li>
        <li>Check the final list yourself, including basic-land quantities and any singleton exceptions.
          The builder's helpers are not a full Commander rules engine.</li>
        <li>Enable a share link to ask your playgroup which cards lack a clear role.</li>
      </ol>
      <p><Link to="/search?q=t%3Aland">Research lands</Link> or <Link to="/collections">start your Commander list</Link>.</p>
    </section>
  </>;
}

function SixtyCardGuide() {
  return <>
    <section>
      <h2>1. Pick the format before picking the cards</h2>
      <p>Standard, Pioneer, Modern, and other constructed formats have different legal card pools.
        Most familiar 60-card constructed formats require at least 60 cards in the main deck and
        allow up to 15 sideboard cards, with a four-copy limit across main and sideboard except for
        basic lands and explicit card exceptions. Confirm the rules for your chosen format.</p>
      <p>Build close to the minimum unless your strategy specifically requires otherwise. Adding
        extra cards reduces the chance of drawing your best cards. The builder's non-Commander mode
        is a workspace, not a guarantee that every card is currently Standard-legal.</p>
    </section>
    <section>
      <h2>2. Define how you win and when</h2>
      <p>An aggressive deck wants to apply pressure early and finish before the opponent stabilizes.
        A control deck needs to survive, exchange resources efficiently, and eventually take over.
        A synergy deck needs enough enablers and payoffs to assemble its engine consistently.</p>
      <p>Choose one primary plan. If your list contains early attackers, slow value engines, and
        expensive finishers in equal measure, opening hands may pull in incompatible directions.
        Start by using several copies of your essential cards rather than many unrelated singletons.</p>
    </section>
    <section>
      <h2>3. Draft a curve and a mana base together</h2>
      <p>As an illustrative creature-deck starting point, use 24 lands, 24 creatures, 8 interaction
        spells, and 4 flexible support slots. That is 60 cards, not a universal recipe. An efficient
        low-curve deck may use fewer lands, while a deck that must reach larger spells may need more.</p>
      <p>Place creatures along a curve rather than choosing them only by power. If you plan to play
        a one-drop followed by a two-drop, your mana base must produce the right colors untapped
        on those turns. Double-colored costs deserve special attention. Reducing an unnecessary
        third color can improve consistency without spending more money.</p>
      <p>Separate "mana value" from what a card really costs in your plan. An alternate-cost spell
        or an X spell may not behave the way its spot on a curve chart suggests.</p>
    </section>
    <section>
      <h2>4. Treat the sideboard as a set of swaps</h2>
      <p>A sideboard card needs an opponent or problem in mind. For every card you add, name the
        main-deck card it replaces. Bringing in eight answers with only three sensible cuts can
        dilute your own win condition. Avoid replacing so many threats that you stop applying pressure.</p>
      <p>For practice, a 15-card sideboard could allocate three slots each to graveyard strategies,
        artifacts or enchantments, wide creature boards, slower control games, and a local matchup.
        Adjust those groups to what you actually face; do not spend slots answering decks that nobody
        plays. Write down your intended swaps before the first match.</p>
    </section>
    <section>
      <h2>5. Test opening hands, then test real games</h2>
      <p>Look for an opening hand with usable mana and a meaningful early sequence. A hand full of
        powerful spells can still be unplayable. Practice mulligan decisions and note whether your
        bad starts come from too few lands, wrong colors, tapped lands, or an overloaded curve.</p>
      <p>Then play against different strategies. Opening-hand tests cannot tell you whether your
        removal lines up against the opponent's threats or whether you can recover after a board wipe.</p>
      <ol>
        <li>Create a deck, add your core cards, and set their quantities.</li>
        <li>Use the Main and Sideboard tabs to keep the zones separate.</li>
        <li>Review the curve, export to Archidekt or Moxfield, and verify format legality there.</li>
        <li>Share your list with a testing partner and ask for feedback on specific matchups.</li>
      </ol>
      <p><Link to="/search?q=f%3Astandard">Research Standard-legal cards on Scryfall</Link> or <Link to="/collections">build a first draft</Link>.</p>
    </section>
  </>;
}

function BudgetGuide() {
  return <>
    <section>
      <h2>1. Set a budget for the whole deck</h2>
      <p>Choose a spending limit before shopping and leave room for sleeves, shipping, and basic
        lands if you need them. A cheap-looking list can become expensive when purchased from several
        sellers. Price estimates are references, not guaranteed offers; condition, language, printing,
        shipping, and availability all change the actual cost.</p>
      <p>Start from cards you already own. A familiar, focused strategy built from your collection
        often performs better than an unfinished list of expensive staples. Choose a small number
        of colors unless the extra color adds something essential.</p>
    </section>
    <section>
      <h2>2. Replace the role, not the price tag</h2>
      <p>When a card is outside your budget, describe its job: cheap removal, recurring draw,
        mana fixing, or a finisher. Search for that role and compare mana cost, speed, restrictions,
        and synergy. A substitute does not need identical rules text to solve the same problem.</p>
      <p>Make cuts in an order that preserves the deck's structure. Premium versions and luxury
        utility cards are good first candidates. Removing lands, all your draw spells, or reliable
        early plays to keep a flashy finisher can make the entire deck worse. Check less expensive
        printings before abandoning a card entirely.</p>
      <p><Link to="/search?q=usd%3C3">Explore cards with a Scryfall USD price below $3</Link>.
        Treat that search as a discovery tool, not a shopping quote or a legality filter.</p>
    </section>
    <section>
      <h2>3. Test before committing to purchases</h2>
      <p>Use clearly unofficial proxies for casual testing only when your group agrees. They are
        not genuine cards and are not normally allowed in sanctioned events. Keep the printed
        information readable, use consistent sleeves, and follow the group's expectations.</p>
      <p>In Redtail Cards, record owned cards in a collection, then compare the deck's needed
        quantities with ownership. Queue only the missing quantities you want to test and print
        from the proxy workflow. Check-offs are an organizing aid; they do not replace checking
        your actual binder before ordering.</p>
    </section>
    <section>
      <h2>4. Keep notes that can change a decision</h2>
      <p>After each game, record the opponent's strategy, whether you played first, mulligans,
        and the first turn your plan worked. Note cards stranded in hand, missing colors, and
        moments when you needed a specific answer. "Lost again" is less useful than "kept two
        lands and could not cast any spell before turn four."</p>
      <ul>
        <li><strong>Repeated mana stalls:</strong> inspect land count, colored sources, and early costs.</li>
        <li><strong>Empty hand too early:</strong> inspect card draw and cards that trade poorly.</li>
        <li><strong>Threats keep dying:</strong> inspect protection, recovery, and threat diversity.</li>
        <li><strong>Cards always wait for a perfect moment:</strong> replace narrow cards with dependable roles.</li>
      </ul>
      <p>A handful of games suggests questions, not proof. Test across different opponents and
        avoid blaming one card for every loss. Change a small package at a time so you can tell
        which adjustment helped.</p>
    </section>
    <section>
      <h2>5. Turn feedback into a purchase plan</h2>
      <p>Rank upgrades by how often they solve a documented problem. Better early mana or a reliable
        draw engine can matter more than another finisher. Buy the upgrades that address repeated
        issues first, then test again before using the rest of the budget.</p>
      <ol>
        <li>Save an export of the first draft so you can compare versions.</li>
        <li>Enable a share link and ask a friend one focused question, such as which five cards feel slow.</li>
        <li>Use hotswap to explore alternatives, but recheck curve, color identity, and legality.</li>
        <li>Remember that the share link is live. Export another text file when you want a lasting version record.</li>
      </ol>
      <p><Link to="/collections">Review your collection</Link> or <Link to="/proxies">prepare a playtest proxy queue</Link>.</p>
    </section>
  </>;
}

export function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = guides.find((entry) => entry.slug === slug);
  if (!guide) return <InfoPage title="Guide not found" description="This deck-building guide does not exist.">
    <Link to="/guides">Browse all guides</Link>
  </InfoPage>;

  return <InfoPage title={guide.title} description={guide.description}>
    <p><Link to="/guides">Back to all guides</Link> | {guide.readTime}</p>
    {guide.slug === 'commander-foundations' ? <CommanderGuide /> :
      guide.slug === 'sixty-card-consistency' ? <SixtyCardGuide /> : <BudgetGuide />}
    <section>
      <h2>Keep learning</h2>
      <ul>{guides.filter((entry) => entry.slug !== guide.slug).map((entry) =>
        <li key={entry.slug}><Link to={`/guides/${entry.slug}`}>{entry.title}</Link></li>
      )}</ul>
    </section>
  </InfoPage>;
}
