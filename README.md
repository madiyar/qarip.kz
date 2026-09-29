# Qarip

Қазақ тілін қолдайтын қаріптер қоры — [qarip.kz](https://qarip.kz).

Static site on [Astro](https://astro.build) + React islands + Tailwind CSS 4, deployed to Netlify.
Content is edited in Git (or via Decap CMS at `/admin`).

## Development

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run check    # type check
```

## Adding a font

```sh
npm run font:add -- --name "Font Name" --designer abay-emes --category sans \
  --license ofl --tags free,cyrillic --our [--zip archive.zip] path/to/*.otf
```

The script copies the files to `public/fonts/<slug>/`, builds WOFF2 previews and a ZIP,
and writes `src/content/fonts/<slug>.json` with style metadata read from the font files
(weight, italic, glyph count, supported alphabets). Edit the JSON afterwards for the
description, preview text, etc.

## Structure

| Path | What |
| --- | --- |
| `src/content/fonts/*.json` | Fonts (styles, license, designer, category…) |
| `src/content/designers/*.json` | Designers |
| `src/content/licenses/*.{json,md}` | Licenses (Markdown body + pricing is optional) |
| `src/content/journal/*.md` | Journal articles |
| `src/content/glossary.json` | Typography glossary |
| `src/data/*.json` | Categories, tags, purposes |
| `src/i18n/en.json` | English UI strings (Kazakh text is the key) |
| `src/lib/sfnt.ts` | Font binary toolkit: WOFF/WOFF2, cmap, name table |
| `src/components/tools/*` | Browser tools: tester, converter, pairing, proofing, freezer, kerning, keyboard |

Pages exist in Kazakh (`/…`) and English (`/en/…`); `src/views/*` hold the page logic
and `src/pages/**` are thin locale wrappers.

Favorites, download history and catalogs are stored in the visitor's browser (localStorage).
