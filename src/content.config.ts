import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const style = z.object({
  name: z.string(),
  slug: z.string(),
  /** Original file offered for download. */
  file: z.string(),
  /** Compressed file used for previews on the site. */
  web: z.string(),
  format: z.string(),
  size: z.number().default(0),
  weight: z.number().min(100).max(900).default(400),
  italic: z.boolean().default(false),
  variable: z.boolean().default(false),
  glyphs: z.number().optional(),
  scripts: z.array(z.string()).default([]),
});

const fonts = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/fonts' }),
  schema: z.object({
    name: z.string(),
    designer: reference('designers'),
    category: reference('categories'),
    tags: z.array(reference('tags')).default([]),
    purposes: z.array(reference('purposes')).default([]),
    license: reference('licenses'),
    our: z.boolean().default(false),
    featured: z.boolean().default(false),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
    /** Editorial quality score, 1 (poor) – 10 (excellent). */
    quality: z.number().min(1).max(10).optional(),
    previewText: z.string().optional(),
    purchaseUrl: z.string().optional(),
    releaseDate: z.string().optional(),
    updatedDate: z.string().optional(),
    addedDate: z.coerce.date(),
    downloads: z.number().default(0),
    primary: z.number().default(0),
    scripts: z.array(z.string()).default([]),
    zip: z.string(),
    zipName: z.string().optional(),
    zipSize: z.number().default(0),
    styles: z.array(style).min(1),
  }),
});

const designers = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/designers' }),
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
    photo: z.string().optional(),
    links: z
      .object({
        website: z.string().optional(),
        telegram: z.string().optional(),
        instagram: z.string().optional(),
        behance: z.string().optional(),
        twitter: z.string().optional(),
        facebook: z.string().optional(),
      })
      .default({}),
  }),
});

const licenses = defineCollection({
  loader: glob({ pattern: '*.{json,md}', base: './src/content/licenses' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    /** Optional pricing tiers for fonts sold by the project. */
    prices: z
      .array(
        z.object({
          title: z.string(),
          price: z.string(),
          href: z.string(),
          cta: z.string(),
          highlight: z.boolean().default(false),
          features: z.array(z.string()).default([]),
        }),
      )
      .default([]),
    url: z.string().optional(),
    commercial: z.boolean(),
    modification: z.boolean(),
    distribution: z.boolean(),
    attribution: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

const categories = defineCollection({
  // Wrapped in an object ({ items: [...] }) so Decap CMS can edit the file.
  loader: file('src/data/categories.json', { parser: (text) => JSON.parse(text).items }),
  schema: z.object({ name: z.string(), description: z.string(), color: z.string() }),
});

const tags = defineCollection({
  loader: file('src/data/tags.json'),
  schema: z.object({ name: z.string() }),
});

const purposes = defineCollection({
  loader: file('src/data/purposes.json'),
  schema: z.object({ name: z.string() }),
});

const journal = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    pubDate: z.coerce.date(),
    author: z.string().optional(),
    authorLink: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const glossary = defineCollection({
  loader: file('src/content/glossary.json', { parser: (text) => JSON.parse(text).terms }),
  schema: z.object({
    term: z.string(),
    en: z.string().optional(),
    definition: z.string(),
    category: z.enum(['fonts', 'typography', 'design', 'other']).default('typography'),
    example: z.string().optional(),
  }),
});

export const collections = { fonts, designers, licenses, categories, tags, purposes, journal, glossary };
