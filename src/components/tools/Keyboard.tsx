import { useEffect, useRef, useState } from 'react';
import CopyButton from '../ui/CopyButton';
import Switch from '../ui/Switch';
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
const WIDE: Record<string, string> = { Backspace: 'flex-[1.6]', Tab: 'flex-[1.5]', CapsLock: 'flex-[1.8]', Enter: 'flex-[1.8]', ShiftLeft: 'flex-[1.3]', ShiftRight: 'flex-[2.3]', Space: 'flex-[8] max-w-lg' };
const KEY_LABEL: Record<string, string> = { Space: 'Бос орын' };
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

  const key = 'relative flex min-w-0 items-center justify-center rounded-[9px] shadow-[var(--key-sh)] transition-[transform,background] active:translate-y-px active:shadow-none';

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <textarea
          ref={area}
          rows={3}
          className="block w-full resize-y rounded-[18px] bg-elev px-[18px] pt-4 pb-[52px] text-[22px] leading-[1.4] text-fg shadow-1 outline-none focus-visible:outline-2 focus-visible:outline-accent"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('Осында теріңіз...')}
          aria-label={t('Мәтін')}
        />
        <div className="absolute right-2.5 bottom-3 flex gap-1.5">
          <button type="button" className="h-[34px] rounded-[9px] bg-fill px-3 text-[13px] font-medium transition-colors hover:bg-fill-2" onClick={() => setText('')}>
            {t('Тазалау')}
          </button>
          <CopyButton text={text} label={t('Көшіру')} done={t('Көшірілді')} className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:bg-accent-hover" />
        </div>
      </div>

      {/* Desktop: the full layout. */}
      <div role="group" aria-label={t('Виртуалды пернетақта')} className="hidden flex-col gap-1.5 overflow-x-auto rounded-[20px] bg-[var(--board)] p-3 select-none sm:flex">
        {ROWS.map((row, i) => (
          <div key={i} className="flex min-w-[700px] justify-center gap-1.5">
            {row.map((k) => {
              const code = Array.isArray(k) ? k[0] : k;
              const label = Array.isArray(k) ? k[1] : null;
              const on = pressed === code || (code.startsWith('Shift') && shift) || (code === 'CapsLock' && caps);
              const kazakh = KEYS[code] && SPECIAL.includes(KEYS[code][1]);
              return (
                <button
                  key={code}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => press(code)}
                  aria-label={label ?? charFor(code, shift, caps)}
                  className={`${key} h-[52px] flex-1 ${WIDE[code] ?? ''} ${on ? 'bg-accent text-on-accent' : label ? 'bg-fill-2 text-fg-2' : 'bg-[var(--key)] text-fg'}`}
                >
                  {label ? (
                    <span className="text-[13px] font-medium">{t(KEY_LABEL[code] ?? label)}</span>
                  ) : (
                    <>
                      <span className="absolute top-1 left-1.5 text-[10px] text-fg-3">{KEYS[code][0] !== KEYS[code][1].toUpperCase() ? KEYS[code][0] : ''}</span>
                      <span className={`text-[19px] ${kazakh ? 'font-semibold' : ''}`}>{charFor(code, shift, caps)}</span>
                      {kazakh && <span className="absolute bottom-1.5 left-1/2 -ml-0.5 size-1 rounded-full bg-accent" />}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Phones: only the letters a phone keyboard lacks. */}
      <div role="group" aria-label={t('Қазақ әріптері')} className="flex flex-col gap-2.5 rounded-[18px] bg-[var(--board)] p-2.5 select-none sm:hidden">
        <div className="grid grid-cols-5 gap-1.5">
          {SPECIAL.map((ch) => {
            const label = shift || caps ? ch.toUpperCase() : ch;
            return (
              <button key={ch} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => (insert(label), shift && setShift(false))} className={`${key} h-[54px] bg-[var(--key)] text-[19px] font-semibold text-fg`}>
                {label}
              </button>
            );
          })}
          <button type="button" aria-pressed={shift} aria-label="Shift" onClick={() => setShift((x) => !x)} className={`${key} h-[54px] text-[15px] ${shift ? 'bg-accent text-on-accent' : 'bg-fill-2 text-fg-2'}`}>
            ⇧
          </button>
        </div>
        <span className="px-1 text-xs text-fg-3">{t('Телефон пернетақтасында жоқ әріптер — басыңыз, мәтінге қосылады')}</span>
      </div>

      <div className="hidden flex-wrap items-center justify-between gap-x-6 gap-y-2 sm:flex">
        <p className="meta">{t('Нүктемен белгіленген пернелер — қазақ әріптері. Стандартты раскладкада олар сандар қатарында орналасқан.')}</p>
        <span className="flex items-center gap-2.5">
          <span id="kb-capture" className="text-[13px] text-fg-2">
            {t('Физикалық пернетақтадан қазақша теру')}
          </span>
          <Switch checked={capture} onChange={setCapture} labelledBy="kb-capture" />
        </span>
      </div>
    </div>
  );
}
