import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCardByName } from '../../services/scryfall';

const POPULAR_SEARCHES = [
  'Lightning Bolt',
  'Sol Ring',
  'Counterspell',
  'Swords to Plowshares',
  'Rhystic Study',
  'Cyclonic Rift',
];

const MTG_NEWS_LINKS = [
  {
    title: 'Magic News - Wizards of the Coast',
    url: 'https://magic.wizards.com/en/news',
    description: 'Official announcements, set previews, and product updates.',
  },
  {
    title: 'Wizards Announcements',
    url: 'https://magic.wizards.com/en/news/announcements',
    description: 'Official release notes, bans, and platform updates.',
  },
  {
    title: 'Wizards Event Locator',
    url: 'https://locator.wizards.com/',
    description: 'Find nearby stores and upcoming MTG events.',
  },
  {
    title: 'Tolarian Community College',
    url: 'https://www.youtube.com/@TolarianCommunityCollege',
    description: 'Deck techs, product reviews, and community commentary.',
  },
];

const FEATURED_ARTICLES = [
  {
    title: 'Magic News Hub',
    description: 'Track set previews, product reveals, and official announcement posts.',
    url: 'https://magic.wizards.com/en/news',
    cardName: 'Chandra, Torch of Defiance',
  },
  {
    title: 'Tolarian Community College Videos',
    description: 'Watch deck analysis, product reviews, and gameplay advice from Prof.',
    url: 'https://www.youtube.com/@TolarianCommunityCollege',
    cardName: 'Kolaghan\'s Command',
  },
  {
    title: 'Wizards Announcements',
    description: 'Follow B&R updates, event policy changes, and platform rollout notes.',
    url: 'https://magic.wizards.com/en/news/announcements',
    cardName: 'Sorin, Imperious Bloodlord',
  },
];

type FeaturedSlide = {
  title: string;
  description: string;
  url: string;
  image: string;
};

function getArtCropUrl(card: {
  image_uris?: { art_crop?: string };
  card_faces?: Array<{ image_uris?: { art_crop?: string } }>;
}): string {
  return card.image_uris?.art_crop ?? card.card_faces?.[0]?.image_uris?.art_crop ?? '';
}

export default function HomePage() {
  const [featuredSlides, setFeaturedSlides] = useState<FeaturedSlide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadSlides = async () => {
      const resolved = await Promise.all(
        FEATURED_ARTICLES.map(async (item) => {
          const card = await getCardByName(item.cardName);
          const image = card ? getArtCropUrl(card) : '';
          return {
            title: item.title,
            description: item.description,
            url: item.url,
            image,
          } as FeaturedSlide;
        })
      );

      if (ignore) return;
      setFeaturedSlides(resolved.filter((slide) => slide.image));
      setActiveSlide(0);
    };

    void loadSlides();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (featuredSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % featuredSlides.length);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [featuredSlides.length]);

  const currentSlide = featuredSlides[activeSlide] ?? null;

  return (
    <div className="page home-page">
      <section className="home-hero card-surface">
        <p className="home-kicker">Welcome to Redtail</p>
        <h1 className="home-title">Build better Magic collections and decks faster.</h1>
        <p className="home-subtitle">
          Magic: The Gathering is a strategy card game with over 30 years of cards,
          formats, and archetypes. Redtail helps you search cards, organize collections,
          and tune decklists in one place.
        </p>
        <div className="home-actions">
          <Link to="/search" className="btn btn-primary">Search Cards</Link>
          <Link to="/collections" className="btn btn-ghost">Open Collections</Link>
        </div>
      </section>

      <section className="home-grid">
        <article className="card-surface home-card">
          <h2>What is MTG?</h2>
          <p>
            MTG is a trading card game where you build a deck and duel opponents using spells,
            creatures, and strategic resource management.
          </p>
        </article>

        <article className="card-surface home-card">
          <h2>Core Formats</h2>
          <p>Popular formats include Standard, Commander, Modern, and Pioneer.</p>
          <p>Commander decks are singleton and built around a legendary commander.</p>
        </article>

        <article className="card-surface home-card">
          <h2>Popular Searches</h2>
          <div className="home-popular-list">
            {POPULAR_SEARCHES.map((name) => (
              <Link key={name} to={`/search?q=${encodeURIComponent(name)}`} className="home-chip">
                {name}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="card-surface home-news-section">
        <h2>Recent MTG News and Resources</h2>
        <p className="muted">Official sources from Wizards of the Coast and Magic channels.</p>

        {currentSlide && (
          <div className="home-featured-articles">
            <a
              href={currentSlide.url}
              target="_blank"
              rel="noreferrer"
              className="home-featured-card"
            >
              <img
                key={currentSlide.image}
                src={currentSlide.image}
                alt={currentSlide.title}
                className="home-featured-image"
              />
              <div className="home-featured-body">
                <h3>{currentSlide.title}</h3>
                <p>{currentSlide.description}</p>
              </div>
            </a>
            <div className="home-slide-dots" aria-hidden="true">
              {featuredSlides.map((slide, index) => (
                <span
                  key={`${slide.title}-${index}`}
                  className={`home-slide-dot ${index === activeSlide ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="home-news-list">
          {MTG_NEWS_LINKS.map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="home-news-link"
            >
              <span className="home-news-title">{item.title}</span>
              <span className="home-news-desc">{item.description}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
