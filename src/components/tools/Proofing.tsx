import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import Select from '../ui/Select';
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
const WORD_GROUPS: [string, string[]][] = [
  ['Тіркестер', ['Қазақстан', 'Алматы', 'Астана', 'Шымкент', 'Қарағанды', 'Атырау', 'Семей', 'Павлодар', 'Тараз', 'Ақтөбе']],
  ['Сан', ['бір', 'екі', 'үш', 'төрт', 'бес', 'алты', 'жеті', 'сегіз', 'тоғыз', 'он']],
  ['Реңктер', ['қара', 'ақ', 'қызыл', 'сары', 'жасыл', 'көк', 'қоңыр', 'сұр', 'күлгін', 'қызғылт']],
];
const KERN_LINES = ['АВАКАЛ ТО ТА ТУ ТЫ ТА ТО', 'VA Va VА Vа WA Wa', 'Та Тo Ту То Тe Тi', '«Сөз» „Текст“ ‘Жазу’ “Font”', 'ААААА ОООOO ЕЕЕЕЕЕ'];
const WORDS = ['Әлемге', 'Ғасыр', 'Қазақстан', 'Ұлттық', 'Үйірме', 'Өнер', 'Һәм', 'Іңкәр', 'Жаңғыру', 'Түркістан', 'Өркениет', 'Құрылтай', 'Шаңырақ', 'Тәуелсіздік', 'Ақмешіт', 'Ұлытау', 'әсем', 'ғылым', 'қағаз', 'өлең', 'ұлағат', 'үміт', 'іңір', 'шығарма'];
const KERN = ['AV', 'AW', 'AY', 'AT', 'LT', 'LY', 'PA', 'TA', 'Te', 'To', 'Ty', 'VA', 'Va', 'WA', 'Wa', 'YA', 'Yo', 'ГА', 'Го', 'ТА', 'То', 'Тә', 'ҮА', 'УА', 'Уа', 'ЧА', 'ЛТ', 'ҚА', 'Қу', 'ГҰ', 'Ғұ', 'Р.', 'Т,', 'Ү.', 'Г.', 'Ә«', 'f.', 'r,', 'y.'];

export default function Proofing({ fonts, lang }: { fonts: FontSummary[]; lang: Lang }) {
  const t = useT(lang);
  const [slug, setSlug] = useState(fonts[0]?.slug ?? '');
  const [custom, setCustom] = useState<LoadedFont | null>(null);
  const [mode, setMode] = useState<Mode>('waterfall');
  const [size, setSize] = useState(16);
  const file = useRef<HTMLInputElement>(null);
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
    <div className="flex flex-col gap-4">
      <div className="no-print flex flex-wrap items-center gap-2.5">
        <Select
          label={t('Қаріп')}
          value={custom ? '__custom' : slug}
          className="inline-flex h-10 items-center gap-2.5 rounded-xl bg-fill pr-3 pl-3.5 transition-colors hover:bg-fill-2"
          onChange={(v) => {
            if (v !== '__custom') {
              setCustom(null);
              setSlug(v);
            }
          }}
          options={[
            ...fonts.map((f) => ({ value: f.slug, text: f.name, label: <span className="text-[17px]" style={{ fontFamily: `'qf-${f.slug}', system-ui` }}>{f.name}</span> })),
            ...(custom ? [{ value: '__custom', text: custom.name, label: <span className="text-[17px]" style={{ fontFamily: `'${custom.family}', system-ui` }}>{custom.name}</span> }] : []),
          ]}
        />
        <div role="group" aria-label={t('Мәтін өлшемі')} className="segmented">
          <button type="button" aria-label={t('Кішірейту')} className="w-[34px] !px-0 text-[17px] !text-fg" onClick={() => setSize((n) => Math.max(10, n - 2))}>
            −
          </button>
          <span className="inline-flex min-w-[52px] items-center justify-center text-[13px] font-medium tabular-nums">{size} px</span>
          <button type="button" aria-label={t('Үлкейту')} className="w-[34px] !px-0 text-[17px] !text-fg" onClick={() => setSize((n) => Math.min(32, n + 2))}>
            +
          </button>
        </div>
        <div className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-fill px-2">
          <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="swatch size-7" aria-label={t('Мәтін түсі')} title={t('Мәтін түсі')} />
          <button type="button" className="icon-btn size-7 rounded-lg" onClick={() => (setFg(bg), setBg(fg))} aria-label={t('Түстерді ауыстыру')} title={t('Түстерді ауыстыру')}>
            <Icon name="swap" size={15} />
          </button>
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="swatch size-7" aria-label={t('Фон түсі')} title={t('Фон түсі')} />
        </div>
        <button type="button" className="btn-secondary btn-rect btn-sm h-10!" onClick={() => file.current?.click()}>
          <Icon name="upload" size={15} />
          {t('Өз файлым')}
        </button>
        <input ref={file} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={async (e) => e.target.files?.[0] && setCustom(await loadFontFile(e.target.files[0]))} />
        <span className="flex-1" />
        {current && !custom && (
          <a className="text-sm text-fg-2 transition-colors hover:text-accent-ink" href={localePath(lang, `/fonts/${current.slug}`)}>
            {t('Қаріп беті')} →
          </a>
        )}
        <button type="button" className="btn-primary btn-rect btn-sm h-10!" onClick={() => window.print()}>
          <Icon name="printer" size={16} />
          {t('Басып шығару')}
        </button>
      </div>

      <div className="no-print tabs" role="tablist" aria-label={t('Тексеру түрі')}>
        {MODES.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} className="tab" onClick={() => setMode(id)}>
            {t(label)}
          </button>
        ))}
      </div>
      <label className="no-print field">
        <Icon name="pen" size={16} />
        <span className="sr-only">{t('Өз мәтініңіз...')}</span>
        <input placeholder={t('Өз мәтініңіз...')} value={text} onChange={(e) => setText(e.target.value)} />
      </label>

      <div className="overflow-hidden rounded-[20px] p-[clamp(20px,4vw,48px)] shadow-1 print:rounded-none print:p-0 print:shadow-none" style={{ background: bg, color: fg }}>
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
            <div className="space-y-8">
              {(text ? [['', text.split(/\s+/)] as [string, string[]]] : [...WORD_GROUPS, ['Мысалдар', WORDS] as [string, string[]]]).map(([label, words]) => (
                <div key={label}>
                  {label && (
                    <p className="mb-2 font-mono text-[10px] uppercase opacity-50" style={{ fontFamily: 'var(--font-mono)' }}>
                      {t(label)}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-8 gap-y-2" style={{ fontSize: size * 2 }}>
                    {words.map((w, i) => (
                      <span key={w + i}>{w}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {mode === 'kerning' && (
            <div className="mb-10 space-y-3" style={{ fontSize: size * 2.5 }}>
              {KERN_LINES.map((l) => (
                <p key={l} className="leading-tight break-words">
                  {l}
                </p>
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
