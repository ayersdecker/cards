export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  mana_cost?: string;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  color_identity: string[];
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    art_crop: string;
  };
  card_faces?: Array<{
    name: string;
    mana_cost?: string;
    type_line: string;
    oracle_text?: string;
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      art_crop: string;
    };
  }>;
  prices: {
    usd: string | null;
    usd_foil: string | null;
  };
  released_at: string;
  cmc: number;
}

export interface ScryfallSearchResponse {
  object: string;
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}

export interface CollectionCard {
  scryfallId: string;
  name: string;
  set?: string;
  set_name: string;
  price: string | null;
  colors: string[];
  imageUri: string;
  addedAt: number;
  quantity: number;
  cmc?: number;
  type_line?: string;
  mana_cost?: string;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  cards: CollectionCard[];
}

export interface DeckCard {
  scryfallId: string;
  name: string;
  set?: string;
  set_name: string;
  price: string | null;
  colors: string[];
  imageUri: string;
  quantity: number;
  cmc: number;
  type_line: string;
  mana_cost?: string;
  isSideboard: boolean;
}

export interface Deck {
  id: string;
  name: string;
  isCommander?: boolean;
  createdAt: number;
  updatedAt: number;
  cards: DeckCard[];
}
