# Qarip

Library of fonts that support the Kazakh language. Live at https://qarip.netlify.app
(the `qarip.kz` domain is currently **not** owned; it may be bought back later).
Repo: `madiyar/qarip.kz`, deploys to Netlify from `main`.

The owner (Madiyar) writes in Russian — reply in Russian. Site content is Kazakh-first.
Commit and push only when asked.

## Background

This repo was a small legacy Astro 4 site. It was rebuilt to match the feature set of a
newer SPA made on base44 (`font.base44.app`; its source is at `~/Downloads/Qarip/`, React +
base44 SDK). Only the *engine* was ported — content was deliberately **not** imported from
base44. The catalog holds the fonts that were already in this repo (Balpaq, Beyne, Hiykaya,
QR Comic Beta, all by Abay Emes); more are added in the CMS at `/admin` (or with
`npm run font:add`). The content editor is the owner's brother, who is not a developer —
the admin UI must stay simple, and adding a font must never require technical fields.

Not ported on purpose: base44 admin pages and auth (Sveltia CMS at `/admin` plays that role),
server-side download counter (site is static), the email newsletter form (it was a dead
stub in the source), `Dictionary`/`New`/`ApiDocs` pages.

## Stack and commands

Astro 7 (static output, Content Layer) · React 19 islands · Tailwind CSS 4 · TypeScript ·
opentype.js 2 · fflate · woff2-encoder (WASM) · sharp. Node 22.

```sh
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
npm run check    # astro check — must stay at 0 errors
npm run font:add -- --name "Font" --designer abay-emes --category sans --license ofl \
  [--tags free,cyrillic] [--our] [--quality 8] [--description-ru "…"] [--archive a.zip] files…
```

There is no test suite. Verify with `npm run check`, `npm run build`, and the browser.

## Layout

| Path | What |
| --- | --- |
| `astro.config.mjs` | `SITE_URL` — the single place for the domain (or `SITE_URL` env var) |
| `src/content.config.ts` | Collections: fonts, designers, licenses, categories, tags, purposes, journal, glossary |
| `public/fonts/<slug>/font.json` + files | One folder per font: editorial fields + `files` (uploaded TTF/OTF) + optional `archive` |
| `src/lib/fontLoader.ts` | Content loader: derives styles, weights, glyphs, alphabets, WOFF2 previews and the ZIP from the files |
| `src/content/{designers,licenses,journal}/` | Designers (JSON), licenses (MD frontmatter, optional pricing + body), articles (MD) |
| `src/content/glossary.json`, `src/data/{categories,donators}.json` | Wrapped objects: `{ "terms": [...] }` / `{ "items": [...] }` |
| `src/data/{tags,purposes}.json`, `faq.ts`, `unicode.ts` | Taxonomies, FAQ (per language), Unicode reference sections |
| `src/views/*.astro` | Page logic, each takes `lang` |
| `src/pages/**`, `src/pages/ru/**`, `src/pages/en/**` | Thin wrappers: `<View lang="kk|ru|en" />` |
| `src/layouts/Base.astro` | `<head>` (title, canonical, hreflang, OG, verification), header, footer |
| `src/components/fonts/` | `FontBrowser` (catalog engine), `FontDetail` (tabs), `GlyphGrid`, `usePreview`… |
| `src/components/tools/` | Tester, Converter, Pairing, Proofing, Freezer, Kerning, Keyboard |
| `src/lib/site.ts` | Contacts, nav, tools list, pangrams, donation card, keyboard zip |
| `src/lib/seo.ts` | Search-facing titles/descriptions per language + JSON-LD builders |
| `src/lib/sfnt.ts` | Font binary toolkit: SFNT parse/build, WOFF, WOFF2, cmap rebuild, family rename |
| `src/lib/store.ts` | localStorage store: favorites, download history, catalogs, prefs |
| `src/lib/og.ts`, `src/pages/og*.ts` | Social preview PNGs rendered at build time |
| `scripts/add-font.mjs` | CLI equivalent of the CMS form: copies files and writes `font.json` |
| `public/admin/` | Sveltia CMS (`index.html` + `config.yml`; keep fields in sync with `content.config.ts`) |
| `public/_redirects` | Netlify redirects: legacy v1 URLs and base44-style URLs |

## Conventions

**i18n.** Three locales: `kk` (default, no prefix), `ru` (`/ru/`), `en` (`/en/`).
UI strings are written in Kazakh and used as keys: `t('Қаріптер')`. Translations live in
`src/i18n/ru.json` and `en.json`; a missing key falls back to Kazakh. When adding a string,
add it to **both** JSON files. Placeholders: `t('{n} стиль', { n })`.
A new page needs a view plus three wrappers (`src/pages/x.astro`, `ru/x.astro`, `en/x.astro`).

**Links.** Always build internal links with `localePath(lang, '/path')`. It adds the locale
prefix and a trailing slash — Netlify serves pages only with a trailing slash (`/fonts` →
301 → `/fonts/`), so links and canonicals must use that form.

**SEO copy.** "Шрифт" is searched far more than "қаріп", and Russian queries dominate
("казахские шрифты скачать"). Titles/descriptions for home, catalog, categories and font
pages come from `src/lib/seo.ts`, not from `t()`. Kazakh copy uses both words.
Categories are static pages (`/fonts/category/<id>/`), not query filters.

**Styling.** Tailwind 4. Design tokens are CSS variables in `src/styles/global.css`
(`bg-bg`, `bg-surface`, `text-muted`, `border-line`, `bg-accent`…); dark is default, light via
`html[data-theme]`. Reusable classes (`btn-primary`, `card`, `chip`, `input`, `icon-btn`,
`segmented`) are defined with `@utility` — `@layer components` classes cannot be `@apply`'d
in Tailwind 4. `--header-h` lets sticky elements sit under the header or the sidebar mode.

**React in Astro.** Icons are `src/components/ui/Icon.tsx`; inside `.astro` files pass
`className`, not `class`. Interactive parts are islands (`client:load`, `client:visible`,
`client:only="react"` for tools and profile). Personal data (favorites, catalogs, history,
preview text and size) is browser-only via `src/lib/store.ts`.

**Fonts.** Preview families are `qf-<slug>` (primary style) and `qf-<slug>-<style>`; the
`@font-face` rules are injected per page through `Base`'s `fontCss` prop. Style metadata is
read from the font binaries by `src/lib/fontLoader.ts` at build time — never stored by hand
and never guessed from file names. `public/fonts/*/web/` (WOFF2 previews, generated ZIPs) is
build output and is gitignored; a font with no usable files is skipped with a warning.

## Gotchas

- **opentype.js `toPathData()` is broken** — it can glue coordinates ("42.4 0" → "42.40")
  and cut outlines short. Use `pathData()` from `src/lib/glyphPath.ts` instead.
- `glossary.json`, `categories.json`, `donators.json` are wrapped in an object
  (`{ "terms": [...] }` / `{ "items": [...] }`); their loaders use a `parser`. Keep that shape —
  the CMS config and the category relation field (`items.*.id`) depend on it.
- The CMS config can be validated against Sveltia's JSON schema
  (`https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json`) with ajv + js-yaml.
- **Restart `astro dev` after changing `content.config.ts` or the shape of a data file** —
  a running server keeps the old content store and renders empty lists. If a server is
  stuck: `npx astro dev stop`.
- **zsh globbing**: quote paths with brackets (`'src/pages/fonts/[slug].astro'`); an
  unmatched glob aborts the whole command line. Shell heredocs with long Cyrillic lines have
  corrupted files before — write such files with the editor tools, not `cat <<EOF`.
- `position: fixed` children of the header get trapped by its `backdrop-filter`; the mobile
  drawer and the sidebar are siblings of `<header>` for that reason.
- `media.base44.com` (base44 file storage) is unreachable from this network, so base44
  font files and the keyboard-layout zip could not be downloaded.
- Never add a Netlify redirect from a host to itself (it loops).

## Domain

`SITE_URL` in `astro.config.mjs` (default `https://qarip.netlify.app`) drives canonicals,
sitemap, hosted CSS (`/fonts/<slug>.css`), OG URLs and the host shown in the UI. When a
custom domain is connected: change `SITE_URL`, `site_url` in `public/admin/config.yml`, and
uncomment the first rule in `public/_redirects`. Contact email is `SITE.email`.

## Admin (Sveltia CMS)

`/admin` runs Sveltia CMS with the GitHub backend: editors sign in with a GitHub account that
has write access to `madiyar/qarip.kz`. Saving commits straight to `main` (no editorial
workflow) and Netlify redeploys. Sign-in options: "Sign In with GitHub" needs a GitHub OAuth
app registered in Netlify (project → Access & security → OAuth) or a Sveltia authenticator
(`backend.base_url`); "Sign In Using Access Token" works without any setup. On localhost,
"Work with Local Repository" edits the working copy directly (Chromium only).

The fonts collection lives in `public/fonts` with `path: '{{slug}}/font'` and entry-relative
media (`media_folder: ''`), so uploaded files land next to `font.json` and are removed with
the entry. Netlify Identity and Git Gateway are no longer used.

## Open items

- Catalog has 4 fonts and four empty categories (sans, serif, slab, monospace pages are
  `noindex` while empty); adding fonts is the main lever for both usefulness and SEO.
- Search Console / Yandex Webmaster not connected yet — codes go into the
  `GOOGLE_SITE_VERIFICATION` / `YANDEX_VERIFICATION` env vars, then submit `/sitemap-index.xml`.
- `SITE.keyboardZip` is empty (download button hidden) — no installer archive available.
- `SITE.donation.card` is empty (donation block hidden); the number in the base44 source
  was a placeholder. `src/data/donators.json` is empty (block hidden).
- Journal articles exist only in Kazakh; glossary and license texts are Kazakh-only content.
- Proofing tool uses each font's primary style only (no style picker).
