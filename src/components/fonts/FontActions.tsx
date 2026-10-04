import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import FavoriteButton from './FavoriteButton';
import { store, useStore } from '../../lib/store';
import { type Lang, useT } from '../../i18n';

interface Props {
  slug: string;
  zip: string;
  zipName?: string;
  purchaseUrl?: string;
  lang: Lang;
}

/** Favorite, download (recorded in local history), add to catalog, buy. */
export default function FontActions({ slug, zip, zipName, purchaseUrl, lang }: Props) {
  const t = useT(lang);
  const { catalogs } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const inCount = catalogs.filter((c) => c.fonts.includes(slug)).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FavoriteButton slug={slug} lang={lang} large />
      <a href={zip} download={zipName ?? true} className="btn-primary px-6" onClick={() => store.recordDownload(slug)}>
        <Icon name="download" size={17} />
        {t('Жүктеу')}
      </a>
      {purchaseUrl && (
        <a href={purchaseUrl} className="btn bg-emerald-600 text-white hover:bg-emerald-700" target={purchaseUrl.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
          <Icon name="cart" size={17} />
          {t('Сатып алу')}
        </a>
      )}
      <div ref={ref} className="relative">
        <button type="button" className="btn-secondary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name="folderPlus" size={17} />
          {t('Каталогқа')}
          {inCount > 0 && <span className="rounded-md bg-accent px-1.5 text-xs text-accent-fg">{inCount}</span>}
        </button>
        {open && (
          <div className="card absolute top-full left-0 z-30 mt-2 w-72 p-2 shadow-2xl">
            {catalogs.length === 0 && <p className="px-2 py-2 text-sm text-muted">{t('Әлі каталог жоқ.')}</p>}
            {catalogs.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                <input type="checkbox" className="accent-[var(--accent)]" checked={c.fonts.includes(slug)} onChange={() => store.toggleInCatalog(c.id, slug)} />
                <span className="flex-1 truncate text-sm">{c.name}</span>
                <span className="text-xs text-muted">{c.fonts.length}</span>
              </label>
            ))}
            <form
              className="mt-2 flex gap-2 border-t border-line pt-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                store.createCatalog(name.trim(), [slug]);
                setName('');
              }}
            >
              <input className="input h-9" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Жаңа каталог')} aria-label={t('Жаңа каталог')} />
              <button type="submit" className="icon-btn shrink-0 bg-surface-2" aria-label={t('Құру')}>
                <Icon name="plus" size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
