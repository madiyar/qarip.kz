import { useEffect, useState } from 'react';
import { featureName } from '../../lib/userfont';
import type { T } from '../../i18n';

interface Rich {
  features: string[];
  langs: number;
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
  const langs = new Set<string>();
  for (const table of [font.tables.gsub, font.tables.gpos]) {
    for (const f of table?.features ?? []) features.add(f.tag);
    for (const s of table?.scripts ?? []) {
      if (s.script?.defaultLangSys) langs.add(`${s.tag}_dflt`);
      for (const l of s.script?.langSysRecords ?? []) langs.add(`${s.tag}_${l.tag}`);
    }
  }
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
    langs: langs.size,
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
      <h2 className="text-[15px] font-semibold text-fg-2">{t('Метадеректер')}</h2>
      <p className="meta mb-1.5">{t('Қаріп файлынан оқылған мәліметтер')}</p>
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

/** Technical details block for the font page "Info" tab. */
export default function FontInfo({ url, t }: { url: string; t: T }) {
  const [rich, setRich] = useState<Rich | null>(null);
  useEffect(() => {
    let off = false;
    inspectFontFile(url)
      .then((r) => !off && setRich(r))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [url]);
  if (!rich) return <p className="meta">{t('Жүктелуде...')}</p>;
  const rows: [string, string][] = [
    ['Кернинг жұптары', rich.kerningPairs ? rich.kerningPairs.toLocaleString() : t('Жоқ')],
    ['Тіл жүйелері', String(rich.langs || '—')],
    ['Units per Em', String(rich.unitsPerEm)],
    ['Вариативті осьтер', rich.axes.length ? rich.axes.join(', ') : t('Жоқ')],
  ];
  return (
    <div className="grid gap-x-14 gap-y-8 md:grid-cols-2">
      <div className="flex flex-col gap-7">
        <section>
          <h2 className="mb-1.5 text-[15px] font-semibold text-fg-2">{t('Техникалық мәліметтер')}</h2>
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
      </div>
      <FontMeta meta={rich.meta} t={t} />
    </div>
  );
}
