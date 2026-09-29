import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import CopyButton from '../ui/CopyButton';
import { type Lang, useT } from '../../i18n';

/** [shifted, normal] per physical key (KeyboardEvent.code), Kazakh layout. */
const KEYS: Record<string, [string, string]> = {
  Backquote: [')', '('], Digit1: ['!', '"'], Digit2: ['Ә', 'ә'], Digit3: ['І', 'і'], Digit4: ['Ң', 'ң'], Digit5: ['Ғ', 'ғ'], Digit6: [';', ','], Digit7: [':', '.'], Digit8: ['Ү', 'ү'], Digit9: ['Ұ', 'ұ'], Digit0: ['Қ', 'қ'], Minus: ['Ө', 'ө'], Equal: ['Һ', 'һ'],
  KeyQ: ['Й', 'й'], KeyW: ['Ц', 'ц'], KeyE: ['У', 'у'], KeyR: ['К', 'к'], KeyT: ['Е', 'е'], KeyY: ['Н', 'н'], KeyU: ['Г', 'г'], KeyI: ['Ш', 'ш'], KeyO: ['Щ', 'щ'], KeyP: ['З', 'з'], BracketLeft: ['Х', 'х'], BracketRight: ['Ъ', 'ъ'],
  KeyA: ['Ф', 'ф'], KeyS: ['Ы', 'ы'], KeyD: ['В', 'в'], KeyF: ['А', 'а'], KeyG: ['П', 'п'], KeyH: ['Р', 'р'], KeyJ: ['О', 'о'], KeyK: ['Л', 'л'], KeyL: ['Д', 'д'], Semicolon: ['Ж', 'ж'], Quote: ['Э', 'э'], Backslash: ['/', '\\'],
  IntlBackslash: ['|', '\\'], KeyZ: ['Я', 'я'], KeyX: ['Ч', 'ч'], KeyC: ['С', 'с'], KeyV: ['М', 'м'], KeyB: ['И', 'и'], KeyN: ['Т', 'т'], KeyM: ['Ь', 'ь'], Comma: ['Б', 'б'], Period: ['Ю', 'ю'], Slash: ['?', '№'],
};

const ROWS: (string | [string, string])[][] = [
  ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', ['Backspace', '⌫']],
  [['Tab', 'Tab'], 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
  [['CapsLock', 'Caps'], 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', ['Enter', 'Enter']],
  [['ShiftLeft', 'Shift'], 'IntlBackslash', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', ['ShiftRight', 'Shift']],
  [['Space', 'Space']],
];
const WIDE: Record<string, string> = { Backspace: 'flex-[1.8]', Tab: 'flex-[1.5]', CapsLock: 'flex-[1.8]', Enter: 'flex-[2]', ShiftLeft: 'flex-[1.3]', ShiftRight: 'flex-[2.4]', Space: 'flex-[8] max-w-lg' };
const SPECIAL = ['ә', 'ғ', 'қ', 'ң', 'ө', 'ұ', 'ү', 'һ', 'і'];

export default function Keyboard({ lang }: { lang: Lang }) {
  const t = useT(lang);
  const [text, setText] = useState('');
  const [shift, setShift] = useState(false);
  const [caps, setCaps] = useState(false);
  const [pressed, setPressed] = useState('');
  const [capture, setCapture] = useState(true);
  const area = useRef<HTMLTextAreaElement>(null);

  const insert = (s: string) => {
    const el = area.current;
    if (!el) return setText((x) => x + s);
    const { selectionStart: a, selectionEnd: b } = el;
    const next = text.slice(0, a) + s + text.slice(b);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + s.length, a + s.length);
    });
  };
  const backspace = () => {
    const el = area.current;
    if (!el) return setText((x) => x.slice(0, -1));
    const { selectionStart: a, selectionEnd: b } = el;
    const from = a === b ? Math.max(0, a - 1) : a;
    setText(text.slice(0, from) + text.slice(b));
    requestAnimationFrame(() => el.setSelectionRange(from, from));
  };

  const charFor = (code: string, shifted: boolean, capsOn: boolean) => {
    const [up, low] = KEYS[code];
    const isLetter = up.toLowerCase() === low && up !== low;
    return (isLetter ? shifted !== capsOn : shifted) ? up : low;
  };

  const press = (code: string) => {
    setPressed(code);
    setTimeout(() => setPressed(''), 120);
    if (KEYS[code]) {
      insert(charFor(code, shift, caps));
      if (shift) setShift(false);
    } else if (code === 'Backspace') backspace();
    else if (code === 'Space') insert(' ');
    else if (code === 'Enter') insert('\n');
    else if (code === 'Tab') insert('\t');
    else if (code === 'CapsLock') setCaps((c) => !c);
    else if (code.startsWith('Shift')) setShift((s) => !s);
  };

  // Typing on a physical keyboard (any layout) produces Kazakh letters in the text area.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!capture || e.target !== area.current || e.ctrlKey || e.metaKey || e.altKey) return;
      if (KEYS[e.code]) {
        e.preventDefault();
        setPressed(e.code);
        setTimeout(() => setPressed(''), 120);
        insert(charFor(e.code, e.shiftKey, e.getModifierState('CapsLock')));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <textarea
          ref={area}
          className="input h-32 resize-y py-3 text-lg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('Осында теріңіз...')}
          aria-label={t('Мәтін')}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" className="accent-[var(--accent)]" checked={capture} onChange={(e) => setCapture(e.target.checked)} />
            {t('Физикалық пернетақтадан қазақша теру')}
          </label>
          <div className="ml-auto flex gap-2">
            <CopyButton text={text} label={t('Көшіру')} done={t('Көшірілді')} />
            <button type="button" className="btn-ghost h-9 px-3" onClick={() => setText('')}>
              {t('Тазалау')}
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto p-3 select-none sm:p-4">
        <div className="min-w-[640px] space-y-1.5">
          {ROWS.map((row, i) => (
            <div key={i} className="flex justify-center gap-1.5">
              {row.map((k) => {
                const code = Array.isArray(k) ? k[0] : k;
                const label = Array.isArray(k) ? k[1] : null;
                const active = pressed === code || (code.startsWith('Shift') && shift) || (code === 'CapsLock' && caps);
                const special = KEYS[code] && SPECIAL.includes(KEYS[code][1]);
                return (
                  <button
                    key={code}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => press(code)}
                    className={`relative flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg border text-base transition-colors ${WIDE[code] ?? ''} ${
                      active ? 'border-accent bg-accent text-accent-fg' : special ? 'border-accent/40 bg-accent-soft hover:bg-surface-2' : 'border-line bg-bg hover:bg-surface-2'
                    }`}
                  >
                    {label ? (
                      <span className="text-xs text-muted">{label}</span>
                    ) : (
                      <>
                        <span className="absolute top-0.5 left-1.5 text-[10px] text-muted">{KEYS[code][0] !== KEYS[code][1].toUpperCase() ? KEYS[code][0] : ''}</span>
                        <span className="font-medium">{charFor(code, shift, caps)}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted">
        <Icon name="info" size={14} />
        {t('Shift және Caps Lock үстіңгі регистр үшін. Ерекшеленген пернелер — қазақ әріптері.')}
      </p>
    </div>
  );
}
