import { useEffect, useMemo, useState } from 'react';
import type { T } from '../../i18n';

interface GlyphInfo {
  index: number;
  name: string;
  unicode?: number;
  advance: number;
  path: string;
}

interface Props {
  /** URL of a TTF/OTF/WOFF file readable by opentype.js. */
  url?: string;
  /** Or an already loaded buffer (tools). */
  buffer?: ArrayBuffer;
  t: T;
  pageSize?: number;
}

type Group = 'all' | 'upper' | 'lower' | 'digits' | 'kazakh' | 'symbols' | 'unencoded';
const GROUPS: [Group, string][] = [
  ['all', 'Барлығы'],
  ['upper', 'Бас әріптер'],
  ['lower', 'Кіші әріптер'],
  ['kazakh', 'Қаз. арнайы'],
  ['digits', 'Сандар'],
  ['symbols', 'Таңбалар'],
  ['unencoded', 'Кодсыз'],
];
const KAZAKH = new Set([...'ӘәҒғҚқҢңӨөҰұҮүҺһІі'].map((c) => c.codePointAt(0)!));
function groupOf(g: GlyphInfo): Group {
  if (g.unicode === undefined) return 'unencoded';
  const ch = String.fromCodePoint(g.unicode);
  if (/^\p{Lu}$/u.test(ch)) return 'upper';
  if (/^\p{Ll}$/u.test(ch)) return 'lower';
  if (/^\p{N}$/u.test(ch)) return 'digits';
  return 'symbols';
}
const inGroup = (g: GlyphInfo, group: Group) => group === 'all' || (group === 'kazakh' ? g.unicode !== undefined && KAZAKH.has(g.unicode) : groupOf(g) === group);

const hex = (n: number) => `U+${n.toString(16).toUpperCase().padStart(4, '0')}`;

/** Renders every glyph of a font from its outlines, including unencoded ones. */
export default function GlyphGrid({ url, buffer, t, pageSize = 240 }: Props) {
  const [glyphs, setGlyphs] = useState<GlyphInfo[] | null>(null);
  const [meta, setMeta] = useState({ upm: 1000, ascender: 800, descender: -200 });
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(pageSize);
  const [selected, setSelected] = useState<GlyphInfo | null>(null);
  const [filter, setFilter] = useState('');
  const [group, setGroup] = useState<Group>('all');

  useEffect(() => {
    let cancelled = false;
    setGlyphs(null);
    setError('');
    (async () => {
      try {
        const opentype = (await import('opentype.js')).default;
        const data = buffer ?? (await (await fetch(url!)).arrayBuffer());
        const font = opentype.parse(data);
        const out: GlyphInfo[] = [];
        for (let i = 0; i < font.glyphs.length; i++) {
          const g = font.glyphs.get(i);
          out.push({
            index: i,
            name: g.name ?? `glyph${i}`,
            unicode: g.unicode,
            advance: g.advanceWidth ?? font.unitsPerEm,
            path: g.getPath(0, 0, font.unitsPerEm).toPathData(2),
          });
        }
        if (!cancelled) {
          setMeta({ upm: font.unitsPerEm, ascender: font.ascender, descender: font.descender });
          setGlyphs(out);
          setSelected(out.find((g) => g.unicode === 0x0493) ?? out.find((g) => g.unicode === 65) ?? out[1] ?? null);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, buffer]);

  const visible = useMemo(() => {
    if (!glyphs) return [];
    const q = filter.trim().toLowerCase();
    const pool = glyphs.filter((g) => inGroup(g, group));
    if (!q) return pool;
    return pool.filter(
      (g) => g.name.toLowerCase().includes(q) || (g.unicode !== undefined && (String.fromCodePoint(g.unicode) === filter.trim() || hex(g.unicode).toLowerCase().includes(q))),
    );
  }, [glyphs, filter, group]);

  if (error) return <p className="text-sm text-rose-500">{t('Глифтерді оқу мүмкін болмады')}</p>;
  if (!glyphs) return <p className="text-sm text-muted">{t('Жүктелуде...')}</p>;

  const { upm, ascender, descender } = meta;
  const height = ascender - descender;
  const box = (g: GlyphInfo, pad = 0.1) => `${-g.advance * pad} ${-ascender - height * pad} ${g.advance * (1 + 2 * pad)} ${height * (1 + 2 * pad)}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {GROUPS.filter(([id]) => id === 'all' || glyphs.some((g) => inGroup(g, id))).map(([id, label]) => (
            <button key={id} type="button" className="chip h-8 text-xs" aria-pressed={group === id} onClick={() => (setGroup(id), setLimit(pageSize))}>
              {t(label)}
              <span className="text-muted">{id === 'all' ? glyphs.length : glyphs.filter((g) => inGroup(g, id)).length}</span>
            </button>
          ))}
        </div>
        <div className="mb-3 flex items-center gap-3">
          <input className="input h-9 max-w-xs" placeholder={t('Глиф іздеу (атауы, таңба, U+...)')} value={filter} onChange={(e) => setFilter(e.target.value)} />
          <span className="text-sm text-muted">{t('{n} глиф', { n: visible.length })}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] overflow-hidden rounded-xl border-t border-l border-line">
          {visible.slice(0, limit).map((g) => (
            <button
              key={g.index}
              type="button"
              onClick={() => setSelected(g)}
              aria-label={`${g.name}${g.unicode !== undefined ? ` ${hex(g.unicode)}` : ''}`}
              className={`flex aspect-square items-center justify-center border-r border-b border-line p-2 transition-colors hover:bg-surface-2 ${selected?.index === g.index ? 'bg-accent-soft' : ''}`}
            >
              <svg viewBox={box(g, 0.05)} className="h-full w-full" aria-hidden="true">
                <path d={g.path} fill="currentColor" />
              </svg>
            </button>
          ))}
        </div>
        {visible.length > limit && (
          <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setLimit((l) => l + pageSize)}>
            {t('Тағы көрсету')} ({visible.length - limit})
          </button>
        )}
      </div>
      {selected && (
        <aside className="card sticky top-24 h-fit p-4">
          <svg viewBox={box(selected, 0.15)} className="aspect-square w-full" aria-hidden="true">
            <line x1={-selected.advance} x2={selected.advance * 2} y1={0} y2={0} stroke="var(--line)" strokeWidth={upm / 200} />
            <line x1={-selected.advance} x2={selected.advance * 2} y1={-ascender} y2={-ascender} stroke="var(--line)" strokeWidth={upm / 200} strokeDasharray={`${upm / 50}`} />
            <line x1={-selected.advance} x2={selected.advance * 2} y1={-descender} y2={-descender} stroke="var(--line)" strokeWidth={upm / 200} strokeDasharray={`${upm / 50}`} />
            <rect x={0} y={-ascender} width={selected.advance} height={height} fill="none" stroke="var(--accent)" strokeOpacity={0.4} strokeWidth={upm / 250} />
            <path d={selected.path} fill="currentColor" />
          </svg>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">{t('Атауы')}</dt>
            <dd className="truncate text-right font-mono">{selected.name}</dd>
            <dt className="text-muted">Unicode</dt>
            <dd className="text-right font-mono">{selected.unicode !== undefined ? hex(selected.unicode) : '—'}</dd>
            <dt className="text-muted">{t('Ені')}</dt>
            <dd className="text-right font-mono">{selected.advance}</dd>
            <dt className="text-muted">{t('Индекс')}</dt>
            <dd className="text-right font-mono">{selected.index}</dd>
          </dl>
          {selected.unicode !== undefined && (
            <button type="button" className="btn-secondary mt-4 w-full" onClick={() => navigator.clipboard?.writeText(String.fromCodePoint(selected.unicode!))}>
              {t('Таңбаны көшіру')}
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
