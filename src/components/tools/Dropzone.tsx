import { useRef, useState } from 'react';
import Icon from '../ui/Icon';
import type { T } from '../../i18n';

interface Props {
  t: T;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  compact?: boolean;
  title?: string;
}

const ACCEPT = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2';

export default function Dropzone({ t, onFiles, multiple = false, compact = false, title }: Props) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const take = (list: FileList | null) => {
    const files = [...(list ?? [])].filter((f) => /\.(ttf|otf|woff2?)$/i.test(f.name));
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };
  const zone = over ? 'border-accent bg-accent-soft' : 'border-line-2 bg-elev hover:border-fg-3';
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title ?? t('Қаріп файлын осында тастаңыз')}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click())}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer border-[1.5px] border-dashed text-center transition-colors ${zone} ${
        compact ? 'min-h-[92px] flex-wrap items-center justify-center gap-3 rounded-[18px] p-4 text-[15px] text-fg-2' : 'min-h-[340px] flex-col items-center justify-center gap-3.5 rounded-3xl p-8'
      }`}
    >
      {compact ? (
        <>
          <Icon name="upload" size={20} strokeWidth={2} />
          {title ? (
            <b className="font-medium text-fg">{title}</b>
          ) : (
            <span>
              {t('Файлдарды тастаңыз немесе')} <b className="font-semibold text-accent-ink">{t('таңдаңыз')}</b>
            </span>
          )}
        </>
      ) : (
        <>
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
            <Icon name="upload" size={24} strokeWidth={2} />
          </span>
          <b className="text-lg font-semibold">{title ?? t('Қаріп файлын осында тастаңыз')}</b>
          <span className="text-sm text-fg-3">TTF, OTF, WOFF, WOFF2{multiple ? ` · ${t('бірнеше файл болады')}` : ''}</span>
          <span className="btn-primary btn-sm h-[42px]!">{t('Файл таңдау')}</span>
        </>
      )}
      <input ref={input} type="file" accept={ACCEPT} multiple={multiple} className="hidden" onChange={(e) => take(e.target.files)} />
    </div>
  );
}
