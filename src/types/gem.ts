export interface GemKV {
  label: string;
  value: string;
}

export interface GemDetails {
  id: string;
  name: string;
  synonym?: string;
  heroImage: string; // file:// or https://
  priceLabel?: string;
  shortNote?: string;

  bestMatches?: Array<{ title: string; score: number; image: string }>;
  otherMatches?: Array<{ title: string; score: number; image: string }>;

  overview?: {
    description?: string;
    wikiUrl?: string;
    category?: GemKV[]; // e.g., Crystal system, Color, Transparency, Luster…
    commonlyFoundIn?: string;
    customMapImage?: string;
  };

  physical?: {
    crystalSystem?: string;
    color?: string;
    transparency?: string;
    luster?: string;
    density?: string;
    mohs?: number; // 1..10
    notes?: GemKV[];
  };

  chemical?: GemKV[];
  maintenance?: GemKV[];

  spiritual?: {
    enabled?: boolean;
    disclaimer?: string;
    fields?: GemKV[];
  };
}
