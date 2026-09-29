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
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
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
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors ${
        over ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-muted'
      } ${compact ? 'gap-1 px-4 py-6' : 'gap-2 px-6 py-16'}`}
    >
      <Icon name="upload" size={compact ? 22 : 36} className="text-muted" />
      <p className="font-semibold">{title ?? t('Қаріп файлын осында тастаңыз!')}</p>
      <p className="text-sm text-muted">{t('немесе файл таңдаңыз')}</p>
      <p className="text-xs text-muted">TTF, OTF, WOFF, WOFF2 · {t('Файлдар серверге жүктелмейді')}</p>
      <input ref={input} type="file" accept={ACCEPT} multiple={multiple} className="hidden" onChange={(e) => take(e.target.files)} />
    </div>
  );
}
