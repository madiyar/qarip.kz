import { useEffect, useState } from 'react';
import { featureName } from '../../lib/userfont';
import type { T } from '../../i18n';
import Skeleton from '../ui/Skeleton';

interface Rich {
  features: string[];
  kerningPairs: number;
  unitsPerEm: number;
  axes: string[];
  meta: [string, string][];
}

const META: [string, string][] = [
  ['fullName', 'Толық атауы'],
  ['postScriptName', 'PostScript атауы'],
  ['version', 'Нұсқасы'],
  ['designer', 'Дизайнер'],
  ['designerURL', 'Дизайнер сайты'],
  ['manufacturer', 'Өндіруші'],
  ['manufacturerURL', 'Өндіруші сайты'],
  ['copyright', 'Авторлық құқық'],
  ['trademark', 'Тауар белгісі'],
  ['description', 'Сипаттама'],
  ['license', 'Лицензия'],
  ['licenseURL', 'Лицензия URL'],
  ['uniqueID', 'Уникалды ID'],
  ['sampleText', 'Үлгі мәтін'],
];

/** Reads technical details straight from a font file (OpenType tables). */
export async function inspectFontFile(source: string | ArrayBuffer): Promise<Rich> {
  const opentype = (await import('opentype.js')).default;
  const buffer = typeof source === 'string' ? await (await fetch(source)).arrayBuffer() : source;
  const font = opentype.parse(buffer);
  const names = font.names.windows ?? font.names.macintosh ?? font.names ?? {};
  const pick = (k: string) => {
    const v = names[k];
    return typeof v === 'string' ? v : (v?.en ?? Object.values(v ?? {})[0]);
  };
  const features = new Set<string>();
  for (const table of [font.tables.gsub, font.tables.gpos]) for (const f of table?.features ?? []) features.add(f.tag);
  let kerningPairs = 0;
  for (const lookup of font.tables.gpos?.lookups ?? []) {
    if (lookup.lookupType !== 2) continue;
    for (const st of lookup.subtables ?? []) {
      if (st.pairSets) kerningPairs += st.pairSets.reduce((n: number, set: unknown[]) => n + set.length, 0);
      else if (st.class1Count && st.class2Count) kerningPairs += st.class1Count * st.class2Count;
    }
  }
  if (!kerningPairs && font.kerningPairs) kerningPairs = Object.keys(font.kerningPairs).length;
  return {
    features: [...features].sort(),
    kerningPairs,
    unitsPerEm: font.unitsPerEm,
    axes: (font.tables.fvar?.axes ?? []).map((a: { tag: string }) => a.tag),
    meta: META.map(([key, label]) => [label, pick(key)] as [string, string]).filter(([, v]) => v),
  };
}

export function FontMeta({ meta, t }: { meta: [string, string][]; t: T }) {
  if (!meta.length) return null;
  return (
    <section>
      <h2 className="text-[15px] font-semibold text-fg-2">{t('Метадерек')}</h2>
      <p className="meta mb-1.5">{t('Қаріп файлынан оқылған мәлімет')}</p>
      <dl className="rows text-sm">
        {meta.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 py-[11px]">
            <dt className="shrink-0 text-fg-3">{t(label)}</dt>
            <dd className="max-h-32 overflow-y-auto text-right text-xs break-words whitespace-pre-line">
              {/^https?:\/\//.test(value) ? (
                <a className="link" href={value} target="_blank" rel="noopener noreferrer">
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Parses a font file for the Info tab; null while loading or while there is no `url`. Keeps the result for the same file. */
export function useFontFile(url?: string): Rich | null {
  const [state, setState] = useState<{ url: string; rich: Rich } | null>(null);
  useEffect(() => {
    if (!url || state?.url === url) return;
    let off = false;
    inspectFontFile(url)
      .then((rich) => !off && setState({ url, rich }))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [url]);
  return url && state?.url === url ? state.rich : null;
}

interface TechProps {
  rich: Rich | null;
  t: T;
  /** Languages counted at build time like the Hyperglot checker (the font's primary style). */
  languages: number;
  /** Axis tags of the font's variable styles; the parsed file may be a static one. */
  axes: string[];
}

/** "Техникалық мәлімет" and the OpenType features of the font page "Info" tab. */
export function FontTech({ rich, t, languages, axes }: TechProps) {
  if (!rich)
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-5 w-48 rounded-md" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[22px] rounded-md" />
        ))}
      </div>
    );
  const allAxes = axes.length ? axes : rich.axes;
  const rows: [string, string][] = [
    ['Керниң жұптары', rich.kerningPairs ? rich.kerningPairs.toLocaleString() : t('Жоқ')],
    ['Тіл жүйесі', languages ? String(languages) : '—'],
    ['Units per Em', String(rich.unitsPerEm)],
    ['Вариатив өс', allAxes.length ? allAxes.join(', ') : t('Жоқ')],
  ];
  return (
    <>
      <section>
        <h2 className="mb-1.5 text-[15px] font-semibold text-fg-2">{t('Техникалық мәлімет')}</h2>
        <dl className="rows text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-[11px]">
              <dt className="text-fg-3">{t(label)}</dt>
              <dd className="text-right font-mono">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {rich.features.length > 0 && (
        <section>
          <h2 className="mb-2.5 text-[15px] font-semibold text-fg-2">
            {t('OpenType мүмкіндіктері')} · {rich.features.length}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {rich.features.map((f) => (
              <span key={f} className="tag font-mono font-medium" title={featureName(f)}>
                {f}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
