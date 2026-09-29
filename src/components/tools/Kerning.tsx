import { useState } from 'react';
import Icon from '../ui/Icon';
import CopyButton from '../ui/CopyButton';
import { type Lang, useT } from '../../i18n';

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

function CharInput({ t, label, value, onChange }: { t: ReturnType<typeof useT>; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{t(label)}</p>
        <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => onChange(split(value).join(' '))}>
          {t('Бос орынмен бөлу')}
        </button>
      </div>
      <textarea className="input h-24 resize-y py-3 font-mono" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(([name, chars]) => (
          <button key={name} type="button" className="chip h-8 text-xs" onClick={() => onChange(`${value}${value && !value.endsWith(' ') ? ' ' : ''}${[...chars].join(' ')}`)}>
            <Icon name="plus" size={12} />
            {t(name)}
          </button>
        ))}
        {value && (
          <button type="button" className="chip h-8 text-xs text-muted" onClick={() => onChange('')}>
            {t('Тазалау')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Kerning({ lang }: { lang: Lang }) {
  const t = useT(lang);
  const [left, setLeft] = useState('A V W Y T');
  const [right, setRight] = useState('A V W Y T');
  const [lowerCtx, setLowerCtx] = useState('non');
  const [upperCtx, setUpperCtx] = useState('HOH');
  const [result, setResult] = useState('');

  const L = split(left);
  const R = split(right);
  const pairs = L.flatMap((a) => R.map((b) => a + b));

  const items = () => result.split(/\s+/).filter(Boolean);
  const set = (list: string[]) => setResult(list.join(' '));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <CharInput t={t} label="Сол таңбалар" value={left} onChange={setLeft} />
        <CharInput t={t} label="Оң таңбалар" value={right} onChange={setRight} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-3 p-4">
          <p className="eyebrow">{t('1-қадам — Комбинациялар жасау')}</p>
          <p className="text-sm text-muted">{t('{n} жұп', { n: pairs.length })}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary h-10" onClick={() => set(pairs)} disabled={!pairs.length}>
              {t('Жұптар жасау')} <span className="font-mono opacity-70">AV</span>
            </button>
            <button type="button" className="btn-secondary h-10" onClick={() => set(L.flatMap((a) => R.map((b) => a + b + a)))} disabled={!pairs.length}>
              {t('Үштіктер жасау')} <span className="font-mono opacity-70">AVA</span>
            </button>
          </div>
        </section>
        <section className="card space-y-3 p-4">
          <p className="eyebrow">{t('2-қадам — Контекстік сөздер')}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label>
              <span className="mb-1 block text-muted">{t('Кіші әріптер үшін')}</span>
              <input className="input h-9 font-mono" value={lowerCtx} onChange={(e) => setLowerCtx(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-muted">{t('БАС ӘРІПТЕР үшін')}</span>
              <input className="input h-9 font-mono" value={upperCtx} onChange={(e) => setUpperCtx(e.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary h-9" disabled={!result} onClick={() => set(items().map((p) => (isUpper(p) ? `${upperCtx}${p}${upperCtx}` : `${lowerCtx}${p}${lowerCtx}`)))}>
              {t('Сөздерді қосу')}
            </button>
            <button type="button" className="btn-secondary h-9" disabled={!result} onClick={() => setResult(items().join(' / '))}>
              {t('Слэш қосу')} /
            </button>
          </div>
        </section>
        <section className="card space-y-3 p-4">
          <p className="eyebrow">{t('3-қадам — Бос орындарды басқару')}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary h-9" disabled={!result} onClick={() => setResult(result.replace(/\s+/g, ''))}>
              {t('Бос орындарды алу')}
            </button>
            <button type="button" className="btn-secondary h-9" disabled={!result} onClick={() => setResult(result.replace(/(\s+)/g, '$1 '))}>
              {t('+1 бос орын')}
            </button>
          </div>
        </section>
      </div>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="font-semibold">
            {t('Нәтиже')} <span className="text-sm font-normal text-muted">{result ? `${[...result].length} ${t('таңба')}` : ''}</span>
          </p>
          <div className="flex gap-2">
            <CopyButton text={result} label={t('Көшіру')} done={t('Көшірілді')} />
            <button type="button" className="btn-ghost h-9 px-3" onClick={() => setResult('')}>
              {t('Тазалау')}
            </button>
          </div>
        </div>
        <textarea className="input h-56 resize-y py-3 font-mono text-base" value={result} onChange={(e) => setResult(e.target.value)} spellCheck={false} />
      </section>

      <div className="text-sm text-muted">
        <p className="mb-2 font-semibold text-fg">{t('Қалай пайдалану:')}</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t('Таңбаларды бос орын арқылы немесе бірге енгізіңіз («Бөлу» түймесі автоматты бөледі)')}</li>
          <li>{t('Жұптар немесе үштіктер жасап, кернинг бағдарламасына (Glyphs, FontLab, RoboFont) көшіріңіз')}</li>
          <li>{t('Контекстік сөздер таңбаларды нақты мәтінде көруге көмектеседі')}</li>
          <li>{t('Слэш кейбір қолданбаларда бөлгіш ретінде пайдаланылады')}</li>
        </ul>
      </div>
    </div>
  );
}
