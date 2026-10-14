import { type CSSProperties, useState } from 'react';
import CopyButton from '../ui/CopyButton';
import Range from '../ui/Range';
import type { T } from '../../i18n';
import type { StyleInfo } from '../../lib/types';

interface Props {
  t: T;
  /** Font name shown before the style name. */
  fontName: string;
  style: StyleInfo;
  text: string;
  textTransform: CSSProperties['textTransform'];
  /** The sample is editable; called with the new text on blur. */
  onEdit: (text: string) => void;
}

/** A variable style at the top of the preview: a slider per axis (read from the file at build time) above its sample. */
export default function VariableStyle({ t, fontName, style, text, textTransform, onEdit }: Props) {
  const axes = style.axes ?? [];
  const defaults = () => Object.fromEntries(axes.map((a) => [a.tag, a.default]));
  const [values, setValues] = useState<Record<string, number>>(defaults);
  const settings = axes.map((a) => `'${a.tag}' ${Math.round(values[a.tag] ?? a.default)}`).join(', ');
  const changed = axes.some((a) => (values[a.tag] ?? a.default) !== a.default);
  const wght = axes.find((a) => a.tag === 'wght');

  return (
    <section className="panel p-5 sm:p-6">
      {axes.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
            {axes.map((a) => (
              <div key={a.tag}>
                <span className="mb-1.5 flex items-center gap-2 text-sm">
                  <span className="tag font-mono">{a.tag}</span>
                  {a.name}
                  <span className="ml-auto font-mono text-accent-ink tabular-nums">{Math.round(values[a.tag] ?? a.default)}</span>
                </span>
                <span className="flex items-center gap-3 text-xs text-fg-3 tabular-nums">
                  {a.min}
                  <Range
                    min={a.min}
                    max={a.max}
                    step={(a.max - a.min) / 200}
                    value={values[a.tag] ?? a.default}
                    onChange={(n) => setValues((v) => ({ ...v, [a.tag]: n }))}
                    className="flex-1"
                    label={`${a.name} (${a.tag})`}
                  />
                  {a.max}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 -ml-2.5 flex flex-wrap items-center gap-1">
            <CopyButton text={`font-variation-settings: ${settings};`} label="CSS" done={t('Көшірілді')} className="btn-ghost btn-sm text-fg-3" />
            {changed && (
              <button type="button" className="btn-ghost btn-sm text-fg-3" onClick={() => setValues(defaults())}>
                {t('Әдепкіге қайтару')}
              </button>
            )}
          </div>
        </>
      )}
      <p className="mt-5 mb-2.5 text-[13px] text-fg-3">
        <b className="font-semibold text-fg-2">{fontName}</b> {style.name}
        <span className="ml-2 font-mono text-xs">
          {wght ? `${wght.min}–${wght.max}` : '100–900'}
          {style.italic ? ' italic' : ''}
        </span>
      </p>
      <div
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        title={t('Мәтінді өзгерту үшін превьюге басыңыз — әр стиль үшін жеке.')}
        className="line-clamp-3 cursor-text leading-[1.15] text-fg [overflow-wrap:anywhere] outline-none focus:line-clamp-none"
        style={{ fontFamily: `'${style.family}', system-ui`, fontSize: 'var(--pv-detail)', textTransform, fontVariationSettings: settings || undefined }}
        onBlur={(e) => onEdit(e.currentTarget.textContent ?? '')}
      >
        {text}
      </div>
    </section>
  );
}
