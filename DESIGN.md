# Qarip design system

The look of qarip.netlify.app: tokens, type, the reusable classes and components, and the rules
for building new pages. Everything here is implemented in `src/styles/global.css` (tokens and
classes) and `src/components/` (components). The reference is the redesign canvas
(claude.ai artifact "Qarip redesign"); where the site deliberately differs from it, the reason is
in [Decisions](#decisions-and-departures-from-the-canvas).

**The one rule:** a look that appears twice is a class in `global.css` or a component — never a
second copy of the same utilities. Before writing markup, look for it here.

---

## Principles

1. **The font speaks first.** On every card, row and page the specimen comes before the label:
   big sample on top, name and meta small underneath. UI chrome stays quiet so fonts can be loud.
2. **Surfaces, not borders.** Depth comes from background steps (`bg` → `elev` → `pop`) and soft
   shadows. Hairlines (`line`) only separate rows inside one surface.
3. **One accent.** Blue (`accent`) marks the single primary action of an area, the current
   selection, links and Qarip's own fonts. Everything else is greyscale — except the category
   names on the home page's style cards, which carry their category's colour (`cat-ink`).
4. **One floating surface.** Menus, popovers, the search panel and dialogs all use `.pop`; on
   phones every `.pop` becomes a bottom sheet over a dimmed page.
5. **Honest content.** No placeholder numbers, prices, goals or names. If data does not exist
   (donation card, keyboard installer, donors), the block is hidden — it is not faked.
6. **Kazakh first.** UI strings are written in Kazakh and translated (`src/i18n/{ru,en}.json`).
   Samples default to Kazakh pangrams so the Kazakh letters are always visible.

---

## Tokens

CSS variables on `:root` (light) and `:root[data-theme='dark']` (dark, the default). Tailwind
names come from `@theme inline`, so `bg-elev`, `text-fg-3`, `border-line` etc. work everywhere.

| Variable | Tailwind | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `--bg` | `bg-bg` | `#f5f5f7` | `#0a0a0b` | Page |
| `--bg-elev` | `bg-elev` | `#ffffff` | `#161618` | Cards, panels, code blocks |
| `--bg-pop` | `bg-pop` | `#ffffff` | `#1e1e21` | Menus and popovers (`.pop`) |
| `--bg-hover` | `bg-hover` | `#fafafb` | `#1c1c1f` | Hovered card |
| `--fill` | `bg-fill` | 4% black | 5% white | Secondary buttons, inputs, chips |
| `--fill-2` | `bg-fill-2` | 7% black | 9% white | Hover of `fill`, tracks |
| `--line` | `border-line` | 8% black | 8% white | Row dividers |
| `--line-2` | `border-line-2` | 14% black | 16% white | Dashed drop zones, checkbox border |
| `--text` | `text-fg` | `#1d1d1f` | `#f5f5f7` | Primary text |
| `--text-2` | `text-fg-2` | `#424245` | `#c7c7cc` | Body text, leads |
| `--text-3` | `text-fg-3` | `#6e6e73` | `#98989d` | Meta, labels, placeholders |
| `--glass` / `--glass-line` | — | 72% white | 70% `#161618` | Header, tab bar, fixed bars (with `backdrop-blur`) |
| `--accent` | `bg-accent` | `#3b63f0` | `#3b63f0` | Primary button, selection |
| `--accent-hover` | `bg-accent-hover` | `#2f54d8` | `#5277ff` | |
| `--accent-text` | `text-accent-ink` | `#2f54d8` | `#86a0ff` | Accent text and links (readable on `bg`) |
| `--accent-soft` | `bg-accent-soft` | 10% accent | 16% accent | Pressed chips, notes, avatars |
| `--accent-ring` | `accent-ring` | 32% accent | 42% accent | Outline of Qarip's own fonts (`.card-own`) |
| `--accent-fg` | `text-on-accent` | white | white | Text on accent |
| `--ok`, `--ok-soft` | `text-ok`, `bg-ok-soft` | green | green | Allowed, present |
| `--warn`, `--warn-soft` | `text-warn`, `bg-warn-soft` | amber | amber | Quality 5–7.5, missing letters |
| `--heart`, `--heart-soft` | `text-heart` | red | red | Favorites, errors, quality < 5 |
| `--bad-soft` | `bg-bad-soft` | 14% red | 18% red | Missing glyph tiles |
| `--cat-l` | — | `0.52` | `0.8` | OKLCH lightness of category-coloured text (`cat-ink`) |
| `--sh-1` / `--sh-2` / `--sh-pop` | `shadow-1/2/pop` | | | Panel outline / lifted card / floating surface |
| `--board`, `--key`, `--key-sh` | — | | | Virtual keyboard only |
| `--header-h` | — | `3.5rem` | | Sticky offset under the header |
| `--tabbar-h` | — | `0` / tab bar height below `lg` | | Space for the mobile tab bar |

**Palette.** Only the blue palette ships. Another palette (the canvas also showed graphite, dala,
teal) is one more block that redefines the `--accent*` variables — no component changes needed.

**Radii.** 8–10 px small controls, 12 px (`rounded-xl`) fields and rectangular buttons, 14 px
toolbars, 16–18 px panels, 20 px cards, 22–24 px feature cards and bottom sheets, full for pills.

---

## Type

| Font | Package | Use |
| --- | --- | --- |
| **Onest Variable** | `@fontsource-variable/onest` | All UI (`font-sans`) — Cyrillic + Kazakh, variable weight |
| **JetBrains Mono Variable** | `@fontsource-variable/jetbrains-mono` | Code, Unicode codes, file names, ranks (`font-mono`) |
| **PT Serif** 400/400i/700 | `@fontsource/pt-serif` | Article text, lead under article titles, Unicode tiles, tool glyphs (`font-serif`) |

All fonts are self-hosted (no Google Fonts; nothing leaves the site). Files load only where a face
is actually used. OG images are rendered with Onest too (`src/lib/og.ts`).

| Class | Size | Use |
| --- | --- | --- |
| `title-xl` | 32 → 44 px, 650 | Home hero |
| `title-lg` | 28 → 32 px, 650 | Page titles (catalog, tools, profile) |
| `PageHeader size="lg"` | 32 → 40 px | Content pages (journal, licenses, FAQ…) |
| `title-md` | 19 → 20 px, 650 | Section titles |
| `title-sm` | 17 px, 600 | Card titles |
| `lead` | 16 → 17 px, `fg-2` | Intro paragraph |
| `sub` | 15 px, `fg-3` | Sub line under a title |
| `meta` | 13 px, `fg-3` | Meta lines, captions |
| `eyebrow` / `label-caps` | 13 / 12 px caps | Small headings above titles / inside panels |
| `prose prose-q` | 18 → 19 px PT Serif | Articles and license texts |

Letter-spacing tightens with size (−0.035 em on big titles). Numbers use `tabular-nums`.
Font previews are never set in UI fonts: they use `qf-<slug>` families (see CLAUDE.md, Fonts).

---

## Layout

- **One frame for every page:** `wrap` — 1200 px, gutters 16 px on phones and 24 px from `sm`.
  `Base` applies it; pages with `wide` apply it themselves. Content always starts at the frame's
  left edge, in line with the logo — never a narrower centred container.
- Long text keeps a readable line length inside the frame, left-aligned: `measure` (720 px) for
  article/license text, `max-w-[680px]` for leads, `max-w-[800px]` for FAQ answers. Panels,
  grids, tables and tool UIs use the full frame.
- `section` — vertical rhythm between page sections (64 → 96 px).
- `Base` wraps the slot in `wrap pt-7 sm:pt-11`; pages with their own width pass `wide`.
- Breakpoints: `sm` 640 (phones → tablets: sheets, fixed font bar), `lg` 1024 (tab bar ↔ header nav).
- **Mobile shell:** header with logo, Support and search; bottom tab bar (`MobileNav.astro`:
  Home, Fonts, Tools, Favorites, More) under `lg`; "More" opens a full-screen panel under the tab
  bar (only its tab is highlighted while open). Fixed bars sit above it with
  `bottom: var(--tabbar-h)`. Pages with a fixed bar add a spacer at the end.
- Grids: `grid sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]`. If cards contain truncated
  text, give the base grid `grid-cols-[minmax(0,1fr)]` or phones overflow horizontally.

---

## Classes (`global.css`)

### Surfaces
| Class | Looks like | Use |
| --- | --- | --- |
| `card` | `elev`, 20 px | Static block |
| `card-link` | `card` + hover `bg-hover` | Clickable card |
| `panel` | `elev`, 18 px, `sh-1` | Tool panels, boxed lists, tables |
| `note` | `fill`, 18 px | Quiet info box, CTA strip |
| `pop` | `bg-pop`, 16 px, `sh-pop` | The floating surface (bottom sheet < 640 px) |
| `pop-scrim` | | Click-catcher behind a `.pop`; dims the page on phones |
| `pop-item` | 44 px row | Menu/listbox item (`aria-selected` highlights) |
| `rows` | children get a bottom hairline | Definition lists, settings, file lists |
| `row-link` | hover `fill` | Clickable row |

### Buttons
| Class | Use |
| --- | --- |
| `btn-primary` | The one main action of an area (accent, pill) |
| `btn-secondary` | Second action (`fill`) |
| `btn-ghost` | Tertiary, inline actions |
| `btn-sm` / `btn-lg` | 36 / 48 px (always win over the base size) |
| `btn-rect` | 12 px corners: font page actions, tool action rows, forms |
| `icon-btn` | 40 px square icon button; override size with `size-9` etc. |
| `link`, `link-quiet`, `link-more` | Accent link / underlined grey inline link / "See all →" |

### Controls
| Class | Use |
| --- | --- |
| `chip` | Toggle (filters, presets, OpenType features). `aria-pressed="true"` → accent-soft |
| `pill` | Navigation choice (categories, glossary/FAQ/licence groups). Current → inverted (`bg-fg text-bg`) via `aria-current` / `aria-selected` / `aria-pressed` |
| `tabs` + `tab` | Underlined tabs (font page, profile, tester, proofing, home) |
| `segmented` | 2–4 exclusive options or a −/+ stepper (`aria-pressed/selected/checked`) |
| `switch` | On/off, use `ui/Switch.tsx` |
| `input` | Text field (44 px, `fill`) |
| `field` | Icon + input in one box (search) |
| `range`, `checkbox`, `swatch`, `kbd` | Slider, checkbox, colour input, key cap |

**Choosing:** filters that combine → `chip`; one-of-many navigation → `pill`; switching panels of
one page → `tabs`; a compact one-of-few setting → `segmented`; boolean setting → `switch`.

### Badges and marks
| Class | Use |
| --- | --- |
| `badge-own` (`ui/OwnBadge`) | The only marker of Qarip's own fonts |
| `card-own` | Accent ring on a card of an own font |
| `tag` | Small grey label (OpenType tags, axis tags) |
| `counter` | Red count on the favorites icon |

### Fonts and text
| Class | Use |
| --- | --- |
| `font-card` | Font card (sample on top, name + meta below) |
| `font-name` | Font/article/designer name; turns accent when its `.font-card` or `.hover-name` parent is hovered |
| `hover-name` | Put on any link card so its `font-name` reacts |
| `cat-ink` | Text in a category's colour: set `--cat` (from `categories.json`, editable in the CMS); lightness comes from `--cat-l` so every hue reads on both themes |
| `prose-q` | With `prose`: article and license text (add `measure`) |
| `measure` | Reading line length (720 px), left-aligned |
| `skeleton` (`ui/Skeleton`) | Pulsing placeholder with the size of what is loading |
| `no-scrollbar` | Horizontal scrollers (tabs, pills on phones) |

---

## Components

### Layout (`src/components/`)
| Component | |
| --- | --- |
| `Header.astro` | Glass bar: logo, nav, tools menu, search, language, theme, favorites, Support |
| `MobileNav.astro` | Tab bar + full-screen "More" panel under it (sibling of the header — `backdrop-filter` traps fixed children) |
| `Footer.astro` | Support / services CTAs, link columns, contacts |
| `LangSwitch.astro` | KK · RU · EN segmented switch |
| `layout/Logo.astro` | Mark + wordmark |
| `layout/ToolGlyph.astro` | Glyph tile of a tool (38 / 76 px) |
| `search/SearchDialog.tsx` | Site search over `/search.json` (⌘K, `/`, any `[data-search-open]`) |

### Page parts (`common/`)
| Component | |
| --- | --- |
| `PageHeader.astro` | Title (+count) and description; `size="md"` lists/tools, `"lg"` content pages |
| `SectionHead.astro` | Section title + "See all →" |
| `Breadcrumbs.astro` | "Fonts / Serif" trail (items without `href` are the current page) |
| `ArticleCard.astro` | Journal card, `variant="featured" \| "card"` |
| `Accordion.astro` | FAQ list (`<details>`) |
| `DownloadCount.astro` | Live download number in static markup; counts `a[data-download]` clicks |
| `ShareButton.tsx` | Native share / copy link; `hint` turns it into a tile |

### UI (`ui/`)
`Icon`, `Select` (listbox in a `.pop`), `Range` + `RangeField` (labelled slider with value),
`Switch`, `CopyButton` + `CodeBlock` (code panel with a title bar), `OwnBadge`, `Skeleton`.

### Fonts (`fonts/`)
| Component | |
| --- | --- |
| `FontRow.tsx` | `FontCard`, `FontRow` and `fontMeta()` — every font list uses these |
| `PreviewToolbar.tsx` | Text, pangram menu (3 pangrams), case, size, view; `usePreview` keeps the state |
| `Catalog.tsx` | Catalog page: heading, category pills (switch without reload), `FontBrowser` |
| `FontBrowser.tsx` | Catalog engine: search, filter sheet, sort, list/grid, paging |
| `HomeFonts.tsx` | Home tabs (new / popular / Qarip), 6 cards each |
| `FontActions.tsx` | Font page actions + fixed mobile bar + thank-you note after download |
| `FontDetail.tsx` | Font page tabs: preview, letters, glyphs, license, CSS, variable, info |
| `GlyphGrid.tsx`, `FontInfo.tsx`, `VariableTab.tsx` | Glyph inspector, technical data, axes |
| `FavoriteButton.tsx` | `variant="round"` in cards, `"square"` on the font page |
| `QualityIndicator.tsx` | Bar + score: green ≥ 8, amber ≥ 5, red below |

### Tools (`tools/`)
`ToolHeader.astro` (breadcrumb, title, "file never leaves the browser") and `OtherTools.astro`
wrap every tool page; `Dropzone.tsx` (large or `compact`) is the only file picker. Tool layouts:
controls in `panel`s, results in `panel`/`CodeBlock`, actions in a row of `btn-rect` buttons.

---

## Page patterns

- **List page** (catalog, category): `Catalog` island — breadcrumb, heading with a fixed-height
  lead, category pills, `FontBrowser`. Top: `PageHeader` → ranked cards and rows.
- **Font page:** breadcrumb → specimen title (84–112 px in the font itself) + meta row → actions
  right → `#dl-thanks` slot → tabs → plain-text download summary (SEO) → similar fonts.
- **Tool page:** `ToolHeader` → tool → `OtherTools`.
- **Content page:** centred column, `PageHeader size="lg"`, panels/rows, a `note` CTA at the end.
- **Empty state:** one grey sentence + one secondary button, centred, no illustration.
- **Loading:** a `Skeleton` with the size and shape of the content (rows, tiles, panels), so
  nothing moves when it arrives — never a "Loading…" line or a spinner. Islands render on the
  server (`client:load`/`client:visible`) whenever their first state does not depend on the
  browser; `client:only` is only for browser-only data (the profile) and then gets a
  `slot="fallback"` skeleton.

## Behaviour

- **Tabs:** `role="tablist"`, ←/→/Home/End move, the font page keeps the tab in `#hash`.
- **Popovers:** close on outside click and Esc; on phones they are bottom sheets with a handle and
  a dimmed scrim. Never give an ancestor of a `.pop` a `z-index` (or `transform`, `filter`,
  `backdrop-filter`): it creates a stacking context and the sheet ends up under the tab bar.
  A popover opened from such an element must be portalled to `<body>` (see `FontActions` →
  `CatalogMenu`). As a safety net the tab bar hides while a `.pop-scrim` is on the page.
- **Inputs on phones** are 16 px (no zoom). Touch targets ≥ 44 px in sheets and bars.
- **Motion:** colour transitions 150 ms; cards may lift 2 px on desktop only; nothing else moves.
- **No layout shift.** Font previews take their size from CSS variables (`--pv-list`,
  `--pv-detail`, `--pv-home`: phone / ≥ 768 px defaults in `global.css`); an inline script in
  `Base` writes the visitor's saved sizes into them before the first paint, so the server markup
  already has the final size. Lists that saved text, case or view will change carry
  `data-pv="<key>"` and stay hidden until `usePreview` applies the prefs. Preview `@font-face`
  rules use `font-display: block` (no fallback-font flash). Catalog categories switch in place
  (`fonts/Catalog.tsx`, `history.pushState`) while every category keeps its static page.
- **Focus:** 2 px accent outline (`:focus-visible`) everywhere; don't remove it.
- **Personal data** (favorites, history, collections, preview text and size) lives in
  `localStorage` (`src/lib/store.ts`); say so where it is shown.

---

## Decisions and departures from the canvas

What was taken from the canvas as is: tokens, Onest/JetBrains Mono, header + mobile tab bar,
search, font cards, preview bar, font page, tools, journal, licenses, FAQ, glossary, profile.

What was changed or left out, and why:

| Canvas | Site | Why |
| --- | --- | --- |
| Four palettes, mode switch in the canvas | Blue only, dark default + light | One brand colour; palettes are one token block away |
| Pangram menu with 7 presets | 3 pangrams (KK 1, KK 2, EN) | Owner's requirement; alphabets stay as chips in the tester |
| Categories as filters | Static category pages drawn as pills | Category pages rank in search (`/fonts/category/<id>/`) |
| Sidebar navigation mode | Removed | One navigation model; the tab bar covers phones |
| Card number, donation goal and progress, donors, prices, `@sozderfonts`, `info@qarip.kz` | Real data from `SITE` / `donators.json`; blocks hidden when empty | No fake data on a live site |
| "Тапсырыс қабылдайды" badge, "one person counted once" | Not shown | No data behind them |
| Favorites: share link / download all | Share works per collection; no "download all" | Zipping many archives in the browser is heavy; collections already share |
| Journal tags | Search instead | Articles have no tags yet |
| About + Support on one page | Two pages, shared look | Both URLs already exist and rank |
| Kerning tool editable result | Live result from the settings | Simpler; copy and edit elsewhere |
| Font page summary only in tabs | Plain-text download summary kept | Answers "download <font>" queries |
| Google Fonts | Self-hosted fonts | Privacy (no third-party requests) and speed |
| "Каталог" for personal lists | "Жинақ" (collection) | "Каталог" already means the font catalog |
| Grey category names on the home style cards | Each English name in its category's colour (Sans blue, Serif yellow, Display red, Slab orange, Handwritten purple, Monospace green) | Owner's request: a colour is remembered faster than a word |
