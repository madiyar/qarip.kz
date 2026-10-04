/** Serialisable font data shared between Astro pages and React islands. */
export interface FontSummary {
  slug: string;
  name: string;
  designer: { slug: string; name: string };
  category: { id: string; name: string; color: string };
  tags: string[];
  purposes: string[];
  quality?: number;
  our: boolean;
  featured: boolean;
  /** Free for commercial use. */
  free: boolean;
  license: string;
  downloads: number;
  addedDate: string;
  stylesCount: number;
  previewText?: string;
  zip: string;
  scripts: string[];
  primary: { url: string; weight: number; italic: boolean };
}

export interface StyleInfo {
  name: string;
  slug: string;
  family: string;
  file: string;
  web: string;
  weight: number;
  italic: boolean;
  variable: boolean;
}

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  color: string;
}
