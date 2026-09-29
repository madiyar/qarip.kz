import { useEffect, useState } from 'react';
import Dropzone from './Dropzone';
import Icon from '../ui/Icon';
import { loadFontFile, type LoadedFont } from '../../lib/userfont';
import { CHARSETS, SITE } from '../../lib/site';
import { type Lang, localePath, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';

const MODES = [
  ['waterfall', 'Сарқырама'],
  ['headings', 'Тақырыптар'],
  ['text', 'Мәтін'],
  ['alphabet', 'Алфавит'],
  ['words', 'Сөздер'],
  ['kerning', 'Кернинг'],
] as const;
type Mode = (typeof MODES)[number][0];

const WATERFALL = [96, 84, 72, 60, 48, 36, 30, 24, 20, 18, 16, 14, 12];
const LINE = 'Бұл гүлді қызға һәм ұлға бер, ал көрші Францияны Пырансы де.';
const PARAGRAPH =
  'Қазақ жазуы ғасырлар бойы дамып келеді. Көне түркі руникасынан бастап, араб, латын және кирилл әліпбилеріне дейін — әр кезең өз ізін қалдырды. Бүгінгі типографтың міндеті — осы бай мұраны заманауи құралдармен жалғастыру, мәтінді оқуға жеңіл әрі көзге жағымды ету. Жақсы қаріп оқырманға байқалмайды: ол ойды жеткізуге қызмет етеді, өзіне назар аудартпайды.';
const WORDS = ['Әлемге', 'Ғасыр', 'Қазақстан', 'Ұлттық', 'Үйірме', 'Өнер', 'Һәм', 'Іңкәр', 'Жаңғыру', 'Түркістан', 'Өркениет', 'Құрылтай', 'Шаңырақ', 'Тәуелсіздік', 'Ақмешіт', 'Ұлытау', 'әсем', 'ғылым', 'қағаз', 'өлең', 'ұлағат', 'үміт', 'іңір', 'шығарма'];
const KERN = ['AV', 'AW', 'AY', 'AT', 'LT', 'LY', 'PA', 'TA', 'Te', 'To', 'Ty', 'VA', 'Va', 'WA', 'Wa', 'YA', 'Yo', 'ГА', 'Го', 'ТА', 'То', 'Тә', 'ҮА', 'УА', 'Уа', 'ЧА', 'ЛТ', 'ҚА', 'Қу', 'ГҰ', 'Ғұ', 'Р.', 'Т,', 'Ү.', 'Г.', 'Ә«', 'f.', 'r,', 'y.'];

export default function Proofing({ fonts, lang }: { fonts: FontSummary[]; lang: Lang }) {
  const t = useT(lang);
  const [slug, setSlug] = useState(fonts[0]?.slug ?? '');
  const [custom, setCustom] = useState<LoadedFont | null>(null);
  const [mode, setMode] = useState<Mode>('waterfall');
  const [size, setSize] = useState(16);
  const [fg, setFg] = useState('#0a0a0a');
  const [bg, setBg] = useState('#ffffff');
  const [text, setText] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('font');
    if (p && fonts.some((f) => f.slug === p)) setSlug(p);
  }, [fonts]);

  const current = fonts.find((f) => f.slug === slug);
  const family = custom ? `'${custom.family}'` : `'qf-${slug}'`;
  const name = custom ? custom.name : current?.name ?? '';
  const line = text || LINE;

  return (
    <div className="space-y-4">
      <div className="no-print card flex flex-wrap items-center gap-3 p-3">
        <select
          className="chip h-10 pr-8 font-semibold"
          value={custom ? '__custom' : slug}
          onChange={(e) => {
            if (e.target.value !== '__custom') {
              setCustom(null);
              setSlug(e.target.value);
            }
          }}
          aria-label={t('Қаріп')}
        >
          {fonts.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
          {custom && <option value="__custom">{custom.name}</option>}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          {t('Өлшемі')}
          <input type="range" min={10} max={32} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24 accent-[var(--accent)]" />
          <span className="w-10 tabular-nums">{size}px</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          {t('Мәтін')}
          <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="size-8 cursor-pointer rounded border border-line bg-transparent" />
        </label>
        <button type="button" className="icon-btn size-8" onClick={() => (setFg(bg), setBg(fg))} aria-label={t('Түстерді ауыстыру')}>
          <Icon name="swap" size={15} />
        </button>
        <label className="flex items-center gap-2 text-sm text-muted">
          {t('Фон')}
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="size-8 cursor-pointer rounded border border-line bg-transparent" />
        </label>
        {current && !custom && (
          <a className="link text-sm" href={localePath(lang, `/fonts/${current.slug}`)}>
            → {t('Қаріп беті')}
          </a>
        )}
        <button type="button" className="btn-secondary ml-auto h-10" onClick={() => window.print()}>
          <Icon name="printer" size={16} />
          {t('Басып шығару')}
        </button>
      </div>

      <div className="no-print grid gap-3 md:grid-cols-[1fr_320px]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented flex-wrap">
            {MODES.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>
                {t(label)}
              </button>
            ))}
          </div>
          <input className="input h-10 min-w-48 flex-1" placeholder={t('Өз мәтініңіз...')} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <Dropzone t={t} compact onFiles={async ([f]) => setCustom(await loadFontFile(f))} title={t('Немесе өз файлыңызды тастаңыз')} />
      </div>

      <div className="rounded-2xl border border-line p-6 sm:p-10 print:border-0 print:p-0" style={{ background: bg, color: fg }}>
        <p className="mb-8 flex justify-between border-b pb-3 font-mono text-xs opacity-60" style={{ borderColor: `${fg}33` }}>
          <span>{name}</span>
          <span>{t(MODES.find((m) => m[0] === mode)![1])} · {SITE.host}</span>
        </p>
        <div style={{ fontFamily: `${family}, system-ui` }}>
          {mode === 'waterfall' && (
            <div className="space-y-3">
              {WATERFALL.map((s) => (
                <div key={s} className="flex items-baseline gap-4">
                  <span className="w-8 shrink-0 font-mono text-[10px] opacity-50" style={{ fontFamily: 'var(--font-mono)' }}>
                    {s}
                  </span>
                  <p className="truncate leading-tight" style={{ fontSize: (s * size) / 16 }}>
                    {line}
                  </p>
                </div>
              ))}
            </div>
          )}
          {mode === 'headings' && (
            <div className="space-y-6">
              {[72, 56, 40, 32, 24, 20].map((s, i) => (
                <p key={s} className="leading-tight" style={{ fontSize: (s * size) / 16 }}>
                  H{i + 1}. {line}
                </p>
              ))}
            </div>
          )}
          {mode === 'text' && (
            <div className="grid gap-8 md:grid-cols-3">
              {[size * 0.8, size, size * 1.25].map((s) => (
                <div key={s}>
                  <p className="mb-2 font-mono text-[10px] opacity-50" style={{ fontFamily: 'var(--font-mono)' }}>
                    {Math.round(s)}px / {Math.round(s * 1.5)}px
                  </p>
                  <p style={{ fontSize: s, lineHeight: 1.5 }}>{text || PARAGRAPH}</p>
                </div>
              ))}
            </div>
          )}
          {mode === 'alphabet' && (
            <div className="space-y-8">
              {CHARSETS.map((set) => (
                <div key={set.label}>
                  <p className="mb-2 font-mono text-[10px] uppercase opacity-50" style={{ fontFamily: 'var(--font-mono)' }}>
                    {t(set.label)}
                  </p>
                  <p className="break-all" style={{ fontSize: size * 2.5, lineHeight: 1.3, letterSpacing: '0.05em' }}>
                    {set.chars}
                  </p>
                </div>
              ))}
            </div>
          )}
          {mode === 'words' && (
            <div className="flex flex-wrap gap-x-8 gap-y-2" style={{ fontSize: size * 2.5 }}>
              {(text ? text.split(/\s+/) : WORDS).map((w, i) => (
                <span key={w + i}>{w}</span>
              ))}
            </div>
          )}
          {mode === 'kerning' && (
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 sm:grid-cols-5 lg:grid-cols-8" style={{ fontSize: size * 3 }}>
              {KERN.map((p) => (
                <span key={p} className="text-center">
                  H{p}H
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
