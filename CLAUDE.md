# Qarip

Library of fonts that support the Kazakh language. Live at https://qarip.app
(the Netlify subdomain `qarip.netlify.app` redirects there; the old `qarip.kz` domain is not owned).
Repo: `madiyar/qarip.kz` (the repo name predates the domain), deploys to Netlify from `main`.

The owner (Madiyar) writes in Russian — reply in Russian. Site content is Kazakh-first.
Commit and push only when asked.

## Background

This repo was a small legacy Astro 4 site. It was rebuilt to match the feature set of a
newer SPA made on base44 (`font.base44.app`; its source is at `~/Downloads/Qarip/`, React +
base44 SDK). Only the *engine* was ported — content was deliberately **not** imported from
base44. The catalog holds the fonts that were already in this repo (Balpaq, Beyne, Hiykaya,
QR Comic Beta, all by Abay Emes); more are added in the CMS at `/admin` (or with
`npm run font:add`). Content editors are not developers — the admin UI must stay simple,
and adding a font must never require technical fields.

Not ported on purpose: base44 admin pages and auth (Sveltia CMS at `/admin` plays that role),
the email newsletter form (it was a dead stub in the source), `Dictionary`/`New`/`ApiDocs` pages.
The download counter was later rebuilt as a Netlify Function (see Download counter below).

## Stack and commands

Astro 7 (static output, Content Layer) · React 19 islands · Tailwind CSS 4 · TypeScript ·
opentype.js 2 · fflate · woff2-encoder (WASM) · sharp · one Netlify Function with Netlify Blobs. Node 22.

```sh
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
npm run check    # astro check — must stay at 0 errors
npm run font:add -- --name "Font" --designer abay-emes[,other] --category sans --license ofl \
  [--tags free,cyrillic] [--our] [--quality 7.5] [--description-ru "…"] --archive a.zip files…
```

There is no test suite. Verify with `npm run check`, `npm run build`, and the browser.

## Layout

| Path | What |
| --- | --- |
| `astro.config.mjs` | `SITE_URL` — the single place for the domain (or `SITE_URL` env var) |
| `src/content.config.ts` | Collections: fonts, designers, licenses, categories, tags, purposes, journal, glossary |
| `public/fonts/<slug>/font.json` + files | One folder per font: editorial fields + `designers` (list) + `files` (uploaded TTF/OTF) + `archive` (ZIP, required in the CMS) |
| `src/lib/fontLoader.ts` | Content loader: derives style names, weights, variable axes, glyphs, alphabets, languages, WOFF2 previews and the ZIP's file list from the files; fetches download counts |
| `public/fonts-web/<slug>/` | Build output (gitignored): WOFF2 previews, and a ZIP only for fonts without an uploaded one |
| `netlify/functions/downloads.mts`, `src/lib/downloads.ts` | Download counter: function + Blobs store, client tracking and live counts |
| `src/content/{designers,licenses,journal}/` | Designers (JSON, bio in kk/ru/en), licenses (MD frontmatter, `visible` switch, optional pricing + body), articles (MD) |
| `src/content/glossary.json`, `src/data/{categories,tags,purposes,donators}.json` | Wrapped objects: `{ "terms": [...] }` / `{ "items": [...] }`; tags and purposes carry their own `nameRu` / `nameEn` |
| `src/data/{faq,unicode}.ts` | FAQ (per language), Unicode reference sections |
| `src/data/languages.json` | Letters of 248 Latin/Cyrillic languages (CLDR exemplars + Kazakh Latin), for the "Тіл" count; rebuilt by `scripts/languages.mjs` |
| `src/views/*.astro` | Page logic, each takes `lang` |
| `src/pages/**`, `src/pages/ru/**`, `src/pages/en/**` | Thin wrappers: `<View lang="kk|ru|en" />` |
| `DESIGN.md` | The design system: tokens, type, classes, components, page patterns, decisions |
| `src/styles/global.css` | Tokens (CSS variables) and every reusable class (`@utility`) |
| `src/layouts/Base.astro` | `<head>` (title, canonical, hreflang, OG, verification), header, mobile tab bar, footer, search |
| `src/components/{Header,Footer,MobileNav,LangSwitch}.astro`, `layout/`, `search/` | Site shell: glass header, bottom tab bar + full-screen "More" panel (below `lg`), logo, tool glyphs, ⌘K search over `/search.json` |
| `src/components/common/` | `PageHeader`, `SectionHead`, `Breadcrumbs`, `ArticleCard`, `Accordion`, `DownloadCount`, `ShareButton` |
| `src/components/fonts/` | `Catalog` (catalog page, in-place category switch), `FontRow` (`FontCard`/`FontRow`), `PreviewToolbar`, `FontBrowser` (catalog engine), `HomeFonts`, `FontActions`, `FontDetail` (tabs), `GlyphGrid`, `usePreview`… |
| `src/components/ui/` | `Icon`, `Select` (custom drop-down), `Range`/`RangeField`, `Switch`, `CopyButton`/`CodeBlock`, `OwnBadge`, `Skeleton` |
| `src/components/tools/` | Tester, Converter, Pairing, Proofing, Freezer, Kerning, Keyboard; `ToolHeader`, `OtherTools`, `Dropzone` |
| `src/lib/journal.ts` | Published articles, reading time, cover glyph |
| `src/lib/site.ts` | Contacts, nav, tools list, pangrams, donation card, keyboard zip |
| `src/lib/seo.ts` | Search-facing titles/descriptions per language + JSON-LD builders |
| `src/lib/sfnt.ts` | Font binary toolkit: SFNT parse/build, WOFF, WOFF2, cmap rebuild, family rename |
| `src/lib/store.ts`, `src/lib/useStore.ts` | localStorage store: favorites, download history, collections (`catalogs` in code), prefs; React hook |
| `src/lib/og.ts`, `src/pages/og*.ts` | Social preview PNGs rendered at build time |
| `scripts/add-font.mjs` | CLI equivalent of the CMS form: copies files and writes `font.json` |
| `public/admin/` | Sveltia CMS (`index.html` + `config.yml`; keep fields in sync with `content.config.ts`) |
| `public/_redirects` | Netlify redirects: legacy v1 URLs and base44-style URLs |

## Conventions

**i18n.** Three locales: `kk` (default, no prefix), `ru` (`/ru/`), `en` (`/en/`).
UI strings are written in Kazakh and used as keys: `t('Қаріптер')`. Translations live in
`src/i18n/ru.json` and `en.json`; a missing key falls back to Kazakh. When adding a string,
add it to **both** JSON files. Placeholders: `t('{n} стиль', { n })`. Tag and purpose names are
translated in their data (`nameRu` / `nameEn`, edited in the CMS), read with `termName()` /
`getTerms()` from `src/lib/fonts.ts` — not with `t()`.
A new page needs a view plus three wrappers (`src/pages/x.astro`, `ru/x.astro`, `en/x.astro`).

**Links.** Always build internal links with `localePath(lang, '/path')`. It adds the locale
prefix and a trailing slash — Netlify serves pages only with a trailing slash (`/fonts` →
301 → `/fonts/`), so links and canonicals must use that form.

**SEO copy.** "Шрифт" is searched far more than "қаріп", and Russian queries dominate
("казахские шрифты скачать"). Titles/descriptions for home, catalog, categories and font
pages come from `src/lib/seo.ts`, not from `t()`. Kazakh copy uses both words.
Categories are static pages (`/fonts/category/<id>/`), not query filters.

**Styling.** Read `DESIGN.md` first. Tailwind 4; tokens are CSS variables in
`src/styles/global.css` exposed as `bg-bg`, `bg-elev`, `bg-fill`, `text-fg`/`fg-2`/`fg-3`,
`border-line`, `bg-accent`, `text-accent-ink`…; dark is default, light via `html[data-theme]`.
Reusable classes (`btn-*`, `card`, `panel`, `note`, `pop`, `chip`, `pill`, `tabs`/`tab`,
`segmented`, `switch`, `input`, `field`, `font-card`, `rows`…) are defined with `@utility` —
`@layer components` classes cannot be `@apply`'d in Tailwind 4. A look used twice becomes a class
or a component. UI fonts are self-hosted (`@fontsource-variable/onest`, JetBrains Mono, PT Serif) —
no Google Fonts. `--header-h` / `--tabbar-h` let sticky and fixed elements clear the header and
the mobile tab bar. The canvas's sidebar navigation mode was dropped.

**Layout and loading.** Every page sits in the same `wrap` frame (1200 px) and starts at its
left edge; narrower text columns are left-aligned (`measure`). Loading states are `ui/Skeleton`
blocks of the final size. Islands render on the server unless their data is browser-only
(`/profile` is `client:only` with a skeleton fallback). Preview sizes come from CSS variables
set before paint (see DESIGN.md, Behaviour) — don't pass pixel sizes to previews.

**Form controls.** No native `<select>` or bare range/checkbox inputs: use `ui/Select.tsx`
(keyboard-accessible listbox), `ui/Range.tsx`, and the `checkbox` / `swatch` classes.

**React in Astro.** Icons are `src/components/ui/Icon.tsx`; inside `.astro` files pass
`className`, not `class`. Interactive parts are islands (`client:load`, `client:visible`,
`client:only="react"` for tools and profile). Personal data (favorites, catalogs, history,
preview text and size) is browser-only via `src/lib/store.ts`.

**Fonts.** Preview families are `qf-<slug>` (primary style) and `qf-<slug>-<style>`; the
`@font-face` rules are injected per page through `Base`'s `fontCss` prop. Style metadata is
read from the font binaries by `src/lib/fontLoader.ts` at build time — never stored by hand
and never guessed from file names. A style's name is what its full name (nameID 4) adds to
the font's name ("PT Sans Narrow Bold" − "PT Sans" → "Narrow Bold"); the sub-family alone
would turn Narrow/Caption/Condensed files into duplicate "Regular"s. Variable styles get
"Variable" in front, without spaces ("VariableRegular", "VariableItalic"), and carry their `axes`
(fvar); the font page shows them first in the preview, with a slider per axis. A font's
`languages` are those whose every letter (both cases) is in one of its files. The primary style is the
editor's `primaryStyle`, else the most regular one (upright, static, 400, normal width).
`public/fonts-web/` (WOFF2 previews, generated ZIPs; URLs carry `?v=<hash>`) is build output
and is gitignored; a font with no usable files is skipped with a warning.

**Download counter.** `netlify/functions/downloads.mts` keeps `{ slug: count }` in one Netlify
Blobs entry (ETag-guarded writes). Download links call `trackDownload()` (React) or carry
`data-download="<slug>"` (Astro, handled by `common/DownloadCount.astro`). The build fetches
`SITE_URL/api/downloads` for sorting (popular tab, `/top`); pages swap in live numbers.
Nothing to configure: Blobs works on every Netlify plan. `DOWNLOADS_OFFLINE=1` skips the fetch.

## Gotchas

- **opentype.js `toPathData()` is broken** — it can glue coordinates ("42.4 0" → "42.40")
  and cut outlines short. Use `pathData()` from `src/lib/glyphPath.ts` instead.
- `glossary.json`, `categories.json`, `tags.json`, `purposes.json`, `donators.json` are wrapped in
  an object (`{ "terms": [...] }` / `{ "items": [...] }`); their loaders use a `parser`. Keep that
  shape — the CMS config and the relation fields of the font form (`items.*.id`) depend on it.
- The CMS config can be validated against Sveltia's JSON schema
  (`https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json`) with ajv + js-yaml.
- **Restart `astro dev` after changing `content.config.ts` or the shape of a data file** —
  a running server keeps the old content store and renders empty lists. If a server is
  stuck: `npx astro dev stop`.
- **zsh globbing**: quote paths with brackets (`'src/pages/fonts/[slug].astro'`); an
  unmatched glob aborts the whole command line. Shell heredocs with long Cyrillic lines have
  corrupted files before — write such files with the editor tools, not `cat <<EOF`.
- `position: fixed` children of any element with `backdrop-filter` get trapped by it: the mobile
  tab bar and its sheet are siblings of `<header>`, and the font page's fixed action bar portals
  its "add to collection" sheet to `<body>`.
- `media.base44.com` (base44 file storage) is unreachable from this network, so base44
  font files and the keyboard-layout zip could not be downloaded.
- Never add a Netlify redirect from a host to itself (it loops).
- **Never put a long `Cache-Control` on `/fonts/*`** in `netlify.toml`: the catalog (`/fonts/`)
  and font pages (`/fonts/<slug>/`) share that path with the font files, and browsers then
  showed a week-old catalog after new fonts were added. Long caching is only for `/fonts-web/*`.
- Pages cached by the old one-week header (until Oct 2026) ask for `/_astro/` files of an earlier
  deploy and render unstyled. `public/_redirects` rewrites missing `/_astro/*` files to
  `public/stale.js`, which refetches the page past the cache and reloads once (guarded by
  sessionStorage). Existing files are not affected (Netlify rules don't shadow real files).
- Sveltia commits big saves in several commits (~16 MB each). A huge ZIP (Literata's is 22 MB)
  can make a save fail half-way and leave stray files (`public/fonts/literata/Literata.zip` is
  an unreferenced duplicate of `Literata-1.zip`).

## Domain

The domain is `qarip.app`. `SITE_URL` in `astro.config.mjs` (default `https://qarip.app`) drives
canonicals, sitemap, hosted CSS (`/fonts/<slug>.css`), OG URLs and the host shown in the UI.
When the domain changes, also change `site_url` / `display_url` in `public/admin/config.yml`
and the first rule in `public/_redirects` (Netlify subdomain → domain). The domain itself is
attached in Netlify (Domain management). Contact email is `SITE.email`.

## Admin (Sveltia CMS)

Fonts have several `designers` (relation, `multiple`), a required ZIP `archive`, `quality`
as a float with step 0.5; there is no "featured" flag and no hand-edited download count.
Designers have `bio` (Kazakh, required, fallback) + `bioRu` / `bioEn`. Licenses have a
`visible` switch: only visible ones are listed on `/licenses` and get their own page.
Tags and purposes are edited under Анықтамалықтар («Тегтер», «Мақсаты»: id + Kazakh name +
`nameRu` / `nameEn`); the font form picks them through relation fields (checkboxes). The tag ids
`free`, `commercial`, `cyrillic`, `latin`, `variable` are used by the catalog filters — keep them.

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

- Catalog has 21 fonts; the slab category is still empty (its page is `noindex` while empty).
  Adding fonts is the main lever for both usefulness and SEO.
- Real download counts start from zero (the old CMS numbers were hand-typed).
- The owner reported an error when uploading variable fonts in the CMS; it did not reproduce
  in a local Sveltia (variable TTF/OTF, names with `,` and `[]` upload fine, and the build reads
  them). Waiting for the exact error text.
- Search Console / Yandex Webmaster not connected yet — codes go into the
  `GOOGLE_SITE_VERIFICATION` / `YANDEX_VERIFICATION` env vars, then submit `/sitemap-index.xml`.
- `SITE.keyboardZip` is empty (download button hidden) — no installer archive available.
- `SITE.donation.card` is empty (donation block hidden); the number in the base44 source
  was a placeholder. `src/data/donators.json` is empty (block hidden).
- Journal articles exist only in Kazakh; glossary and license texts are Kazakh-only content.
- Proofing tool uses each font's primary style only (no style picker).
- Personal lists are called "Жинақ" (collection) in the UI; the code and localStorage still say
  `catalogs`. Old `#catalogs` links on `/profile/` open the collections tab.
