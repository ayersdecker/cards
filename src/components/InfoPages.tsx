import React, { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LAST_UPDATED = 'October 4, 2026';

function usePageMetadata(title: string, description: string) {
  const { pathname } = useLocation();

  useEffect(() => {
    const previousTitle = document.title;
    let descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const openGraphTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    const openGraphDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    const openGraphUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    const createdMeta = !descriptionMeta;

    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.name = 'description';
      document.head.appendChild(descriptionMeta);
    }

    const previousDescription = descriptionMeta.content;
    const previousCanonical = canonicalLink?.href;
    const previousOpenGraphTitle = openGraphTitle?.content;
    const previousOpenGraphDescription = openGraphDescription?.content;
    const previousOpenGraphUrl = openGraphUrl?.content;
    document.title = `${title} | Redtail Cards`;
    descriptionMeta.content = description;
    if (canonicalLink) canonicalLink.href = `https://redtailcards.com${pathname}`;
    if (openGraphTitle) openGraphTitle.content = `${title} | Redtail Cards`;
    if (openGraphDescription) openGraphDescription.content = description;
    if (openGraphUrl) openGraphUrl.content = `https://redtailcards.com${pathname}`;

    return () => {
      document.title = previousTitle;
      if (createdMeta) {
        descriptionMeta?.remove();
      } else if (descriptionMeta) {
        descriptionMeta.content = previousDescription;
      }
      if (canonicalLink && previousCanonical) canonicalLink.href = previousCanonical;
      if (openGraphTitle && previousOpenGraphTitle) openGraphTitle.content = previousOpenGraphTitle;
      if (openGraphDescription && previousOpenGraphDescription) openGraphDescription.content = previousOpenGraphDescription;
      if (openGraphUrl && previousOpenGraphUrl) openGraphUrl.content = previousOpenGraphUrl;
    };
  }, [title, description, pathname]);
}

export function InfoPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  usePageMetadata(title, description);

  return (
    <article className="page info-page">
      <header className="info-page-header">
        <p className="info-page-kicker">REDTAIL CARDS</p>
        <h1 className="page-title">{title}</h1>
        <p className="info-page-intro">{description}</p>
      </header>
      <div className="info-page-content">{children}</div>
    </article>
  );
}

export function AboutPage() {
  return (
    <InfoPage
      title="About Redtail Cards"
      description="A practical workspace for exploring Magic cards, organizing a personal collection, and planning decks."
    >
      <section>
        <h2>From card search to a playable list</h2>
        <p>
          Redtail Cards brings card research and personal card organization into one place. Search card
          names and rules text, compare printings, track quantities in collections, and use collection
          data while building a deck. The goal is a clear workflow: find a card, decide where it fits,
          and keep a useful record of the list.
        </p>
        <p>
          Card search and the daily Commander feature are available without an account. A Google account
          is only needed to save collections and decks, view a personal trade binder, or manage a proxy
          print queue. Saved collections and decks are private by default. You can optionally enable
          a read-only deck link that anyone can view without an account, and revoke it at any time.
          Our <Link to="/guides">deck-building guides</Link> are also free to read.
        </p>
      </section>

      <section>
        <h2>Tools for real play groups</h2>
        <ul>
          <li>Search card data and review available printings.</li>
          <li>Track owned quantities and estimated collection value.</li>
          <li>Build decks with main-board, sideboard, and Commander support.</li>
          <li>Prepare print sheets for clearly unofficial play-test proxies.</li>
          <li>Export collection and deck lists for personal reference.</li>
        </ul>
      </section>

      <section>
        <h2>Independent project</h2>
        <p>
          Redtail Cards is an independent project built by Decker Ayers. It is not affiliated with,
          endorsed by, or sponsored by Wizards of the Coast. Magic: The Gathering and related names and
          marks belong to their respective owners. Card data and images are provided through third-party
          services; see our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <p className="info-page-action">
        <Link to="/search" className="btn btn-primary">Explore card search</Link>
      </p>
    </InfoPage>
  );
}

export function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      description={`How Redtail Cards handles account information, saved lists, analytics, and third-party services. Last updated ${LAST_UPDATED}.`}
    >
      <section>
        <h2>Information we handle</h2>
        <ul>
          <li>
            <strong>Account information:</strong> When you sign in with Google, Firebase Authentication
            processes the account identity information Google makes available, such as your email address,
            display name, and profile image.
          </li>
          <li>
            <strong>Saved content:</strong> Collections, decks, quantities, and related settings you save
            are stored in Firebase Firestore and associated with your account. Firestore rules restrict
            access to the owning account. If you enable deck sharing, a separate read-only decklist
            is available to anyone with its link and stays updated as you edit. It includes the deck
            name, cards, quantities, commander, and sideboard, but not your email, collection,
            ownership check-offs, or proxy queue. Anyone with the link can forward it or export a copy.
            Turning sharing off or deleting the deck removes the shared list and revokes the link;
            it cannot remove copies someone has already saved.
          </li>
          <li>
            <strong>Browser storage:</strong> Storage-rule preferences and a small Commander card cache
            are saved in your browser. These values are not account-synced.
          </li>
          <li>
            <strong>Usage information:</strong> Firebase Analytics may process information about app
            usage, browser, device, and approximate location to help understand site performance.
          </li>
        </ul>
      </section>

      <section>
        <h2>Third-party services</h2>
        <p>
          The service uses Google Firebase for sign-in, database storage, and analytics. Card searches
          and card data requests are sent to Scryfall. These providers process information under their
          own terms and privacy policies:
        </p>
        <ul>
          <li><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a></li>
          <li><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer">Firebase Privacy and Security</a></li>
          <li><a href="https://scryfall.com/docs/privacy" target="_blank" rel="noreferrer">Scryfall Privacy Policy</a></li>
        </ul>
      </section>

      <section>
        <h2>Advertising and cookies</h2>
        <p>
          Redtail Cards does not currently display Google AdSense advertisements. If advertising is
          enabled, Google and its partners may use cookies or similar technologies to deliver, measure,
          and personalize ads based on visits to this and other sites. You can learn about Google's
          advertising technology and controls in its{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">
            advertising policies
          </a>.
        </p>
        <p>
          The site also uses browser storage for the features described above. Browser settings can be
          used to clear or restrict local storage and cookies, although some features may then stop
          working. Where consent is legally required for analytics or advertising technologies, those
          technologies should not be enabled until an appropriate consent mechanism is in place.
        </p>
      </section>

      <section>
        <h2>Retention and your choices</h2>
        <p>
          Saved collections and decks remain associated with your Firebase account until deleted. The
          Turn off deck sharing before deleting your account to revoke any shared links. The
          current account-deletion control removes the Firebase Authentication account but does not
          automatically delete Firestore collection and deck records. To request removal of saved
          records, contact the maintainer privately using the method on the{' '}
          <Link to="/contact">contact page</Link>. Do not post account details in public issues or send
          passwords or authentication codes.
        </p>
        <p>
          You can remove browser-stored preferences by clearing site data in your browser. Requests
          about access, correction, or deletion of personal information can be sent through the contact
          method on this site.
        </p>
      </section>

      <section>
        <h2>Policy updates</h2>
        <p>
          This policy may be updated when the service or its data practices change. The latest revision
          date appears at the top of this page. Contact details are available on the{' '}
          <Link to="/contact">Contact page</Link>.
        </p>
      </section>
    </InfoPage>
  );
}

export function TermsPage() {
  return (
    <InfoPage
      title="Terms of Use"
      description={`The terms for using Redtail Cards. Last updated ${LAST_UPDATED}.`}
    >
      <section>
        <h2>Using the service</h2>
        <p>
          Redtail Cards provides card search, collection tracking, deck planning, exports, and print
          preparation tools. You are responsible for activity on your account and for keeping your
          Google account secure. Do not misuse the service, interfere with its operation, or attempt to
          access another user's saved information.
        </p>
      </section>

      <section>
        <h2>Card data, prices, and images</h2>
        <p>
          Card information, availability, images, and prices come from third-party sources and may be
          incomplete, delayed, or inaccurate. Values shown by the app are estimates for reference only,
          not offers to buy or sell and not financial advice. Verify important details with the relevant
          source before relying on them.
        </p>
        <p>
          Magic: The Gathering, card names, symbols, and related intellectual property belong to their
          respective owners. Redtail Cards is an independent service and is not affiliated with or
          endorsed by Wizards of the Coast.
        </p>
      </section>

      <section>
        <h2>Print preparation</h2>
        <p>
          Print outputs are intended for personal play-testing and other uses permitted by the relevant
          rights holders and play venue. Printed substitutes are unofficial, are not tournament-legal
          cards, and must never be represented or sold as genuine cards. You are responsible for
          following applicable laws, event rules, and the policies of your play group or venue.
        </p>
      </section>

      <section>
        <h2>Third-party services and availability</h2>
        <p>
          The app depends on services including Google Firebase and Scryfall.
          Their services are governed by their own terms. Redtail Cards is provided on an as-available
          basis; features, data, or access may change, and saved data should not be treated as your only
          backup.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent through the{' '}
          <Link to="/contact">Contact page</Link>.
        </p>
      </section>
    </InfoPage>
  );
}

export function ContactPage() {
  return (
    <InfoPage
      title="Contact"
      description="Reach the Redtail Cards maintainer with questions, feedback, or privacy requests."
    >
      <section>
        <h2>Support and feedback</h2>
        <p>
          Redtail Cards is maintained by Decker Ayers. For bug reports, feature requests, or help with
          the site, open an issue in the public project repository. Please do not include passwords,
          authentication codes, account emails, or private collection exports in a public issue. For
          privacy requests, use the maintainer's website instead of a public issue.
        </p>
        <p className="info-page-action">
          <a
            className="btn btn-primary"
            href="https://github.com/ayersdecker/cards/issues"
            target="_blank"
            rel="noreferrer"
          >
            Contact via GitHub
          </a>
        </p>
        <p>
          For private contact, visit{' '}
          <a href="https://www.deckerayers.com/contact.html" target="_blank" rel="noreferrer">
            the private contact form
          </a>.
        </p>
      </section>
    </InfoPage>
  );
}