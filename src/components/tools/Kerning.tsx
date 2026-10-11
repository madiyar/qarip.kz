import { useState } from 'react';
import Icon from '../ui/Icon';
import CopyButton from '../ui/CopyButton';
import Switch from '../ui/Switch';
import { loadFontFile, type LoadedFont } from '../../lib/userfont';
import { type Lang, type T, useT } from '../../i18n';

const PRESETS = [
  ['Лат. бас', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  ['Лат. кіші', 'abcdefghijklmnopqrstuvwxyz'],
  ['Күрделі жұптар', 'AFKLPTVWXYfkrtvwxy'],
  ['Кирилл бас', 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'],
  ['Қазақша', 'ӘәҒғҚқҢңӨөҰұҮүҺһІі'],
  ['Сандар', '0123456789'],
  ['Тыныс белгілер', '.,:;!?«»()-–—'],
] as const;

const split = (s: string) => [...new Set([...s.replace(/\s+/g, '')])];
const isUpper = (s: string) => s === s.toUpperCase() && s !== s.toLowerCase();

function CharInput({ t, id, label, value, onChange }: { t: T; id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5 rounded-[18px] bg-elev p-4">
      <label htmlFor={id} className="label-caps">
        {t(label)}
      </label>
      <input id={id} className="input font-mono text-[17px]" value={value} onChange={(e) => onChange(e.target.value)} placeholder={t('Бос орынмен бөліңіз')} spellCheck={false} />
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(([name, chars]) => (
          <button key={name} type="button" className="chip h-[30px] px-[11px] text-[13px]" onClick={() => onChange(`${value}${value && !value.endsWith(' ') ? ' ' : ''}${[...chars].join(' ')}`)}>
            {t(name)}
          </button>
        ))}
        {value && (
          <button type="button" className="h-[30px] px-2 text-[13px] text-fg-3 hover:text-fg" onClick={() => onChange('')}>
            {t('Тазалау')}
          </button>
        )}
      </div>
    </div>
  );
}

/** Kerning test strings: pairs or triples of two character sets, optionally inside context words. */
export default function Kerning({ lang }: { lang: Lang }) {
  const t = useT(lang);
  const [left, setLeft] = useState('A V W Y T Ә Қ Ү');
  const [right, setRight] = useState('A V W Y T а о у');
  const [kind, setKind] = useState<'pairs' | 'triples'>('pairs');
  const [words, setWords] = useState(false);
  const [lowerCtx, setLowerCtx] = useState('non');
  const [upperCtx, setUpperCtx] = useState('HOH');
  const [slash, setSlash] = useState(false);
  const [spaces, setSpaces] = useState<0 | 1 | 2>(1);
  const [previewSize, setPreviewSize] = useState(40);
  const [previewFont, setPreviewFont] = useState<LoadedFont | null>(null);

  const L = split(left);
  const R = split(right);
  const combos = L.flatMap((a) => R.map((b) => (kind === 'pairs' ? a + b : a + b + a)));
  const items = words ? combos.map((p) => (isUpper(p) ? `${upperCtx}${p}${upperCtx}` : `${lowerCtx}${p}${lowerCtx}`)) : combos;
  const gap = ' '.repeat(spaces);
  const result = items.join(slash ? `${gap}/${gap}` : gap);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap gap-3.5">
        <CharInput t={t} id="k-left" label="Сол таңбалар" value={left} onChange={setLeft} />
        <CharInput t={t} id="k-right" label="Оң таңбалар" value={right} onChange={setRight} />
      </div>

      <div className="grid gap-3.5 md:grid-cols-3">
        <div className="rounded-[18px] bg-elev p-4">
          <p className="mb-2.5 text-[13px] font-semibold text-fg-3">{t('1-қадам · Комбинация')}</p>
          <div className="flex items-center justify-between gap-3">
            <div role="radiogroup" aria-label={t('Түрі')} className="segmented">
              <button type="button" role="radio" aria-checked={kind === 'pairs'} onClick={() => setKind('pairs')}>
                {t('Жұптар')} <span className="font-mono text-xs opacity-60">AV</span>
              </button>
              <button type="button" role="radio" aria-checked={kind === 'triples'} onClick={() => setKind('triples')}>
                {t('Үштіктер')} <span className="font-mono text-xs opacity-60">AVA</span>
              </button>
            </div>
            <span className="meta tabular-nums">{t('{n} жұп', { n: combos.length })}</span>
          </div>
        </div>
        <div className="rounded-[18px] bg-elev px-4 py-2">
          <p className="mt-2 text-[13px] font-semibold text-fg-3">{t('2-қадам · Контекст')}</p>
          <div className="flex min-h-11 items-center justify-between gap-3">
            <span id="k-words" className="text-sm">
              {t('Сөздер ішінде көрсету')}
            </span>
            <Switch checked={words} onChange={setWords} labelledBy="k-words" />
          </div>
          {words && (
            <div className="grid grid-cols-2 gap-2 pb-2">
              <input className="input h-9 font-mono text-sm" value={lowerCtx} onChange={(e) => setLowerCtx(e.target.value)} aria-label={t('Кіші әріптер үшін')} title={t('Кіші әріптер үшін')} />
              <input className="input h-9 font-mono text-sm" value={upperCtx} onChange={(e) => setUpperCtx(e.target.value)} aria-label={t('БАС ӘРІПТЕР үшін')} title={t('БАС ӘРІПТЕР үшін')} />
            </div>
          )}
          <div className="flex min-h-11 items-center justify-between gap-3">
            <span id="k-slash" className="text-sm">
              {t('Слэшпен бөлу')} /
            </span>
            <Switch checked={slash} onChange={setSlash} labelledBy="k-slash" />
          </div>
        </div>
        <div className="rounded-[18px] bg-elev p-4">
          <p className="mb-2.5 text-[13px] font-semibold text-fg-3">{t('3-қадам · Бос орындар')}</p>
          <div role="radiogroup" aria-label={t('Бос орындар')} className="segmented">
            {(
              [
                [0, 'Жоқ'],
                [1, '1 бос орын'],
                [2, '2 бос орын'],
              ] as const
            ).map(([n, label]) => (
              <button key={n} type="button" role="radio" aria-checked={spaces === n} onClick={() => setSpaces(n)}>
                {t(label)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] bg-elev">
        <div className="flex items-center justify-between gap-2.5 border-b border-line py-2 pr-2 pl-4">
          <span className="meta">
            {t('Нәтиже')} · {[...result].length} {t('таңба')}
          </span>
          <CopyButton text={result} label={t('Көшіру')} done={t('Көшірілді')} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-fill px-3 text-[13px] font-medium text-fg hover:bg-fill-2" />
        </div>
        <p className="min-h-[120px] px-4 py-[18px] font-mono text-[18px] leading-[1.8] whitespace-pre-wrap text-fg [overflow-wrap:anywhere]">{result}</p>
      </div>

      {result && (
        <div className="overflow-hidden rounded-[18px] bg-elev">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line py-2 pr-2 pl-4">
            <span className="meta">{t('Алдын ала көру')}</span>
            <div className="flex items-center gap-2">
              <div role="group" aria-label={t('Өлшемі')} className="segmented">
                <button type="button" aria-label={t('Кішірейту')} className="h-7! w-8 !px-0 !text-fg" onClick={() => setPreviewSize((n) => Math.max(16, n - 8))}>
                  −
                </button>
                <span className="inline-flex min-w-12 items-center justify-center text-[13px] font-medium tabular-nums">{previewSize} px</span>
                <button type="button" aria-label={t('Үлкейту')} className="h-7! w-8 !px-0 !text-fg" onClick={() => setPreviewSize((n) => Math.min(120, n + 8))}>
                  +
                </button>
              </div>
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-fill px-3 text-[13px] font-medium transition-colors hover:bg-fill-2">
                <Icon name="upload" size={14} />
                <span className="max-w-40 truncate">{previewFont ? previewFont.name : t('Өз қарпіңізбен көру')}</span>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) setPreviewFont(await loadFontFile(file).catch(() => null));
                  }}
                />
              </label>
            </div>
          </div>
          <p className="px-4 py-[18px] leading-[1.6] break-all whitespace-pre-wrap" style={{ fontSize: previewSize, fontFamily: previewFont ? `'${previewFont.family}'` : undefined }}>
            {result}
          </p>
        </div>
      )}

      <ul className="mt-1.5 list-disc pl-[18px] text-sm leading-[1.7] text-fg-3">
        <li>{t('Таңбаларды бос орын арқылы немесе бірге жазыңыз — генератор өзі бөледі.')}</li>
        <li>{t('Жұптарды немесе үштіктерді кернинг бағдарламасына (Glyphs, FontLab, RoboFont) көшіріңіз.')}</li>
        <li>{t('Контекст сөздері таңбаны нақты мәтінде көруге көмектеседі.')}</li>
        <li>{t('Кейбір бағдарламаларда слэш бөлгіш ретінде қолданылады.')}</li>
      </ul>
    </div>
  );
}
