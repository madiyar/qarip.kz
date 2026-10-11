import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon';
import FavoriteButton from './FavoriteButton';
import { store } from '../../lib/store';
import { useStore } from '../../lib/useStore';
import { trackDownload } from '../../lib/downloads';
import { type Lang, localePath, useT } from '../../i18n';

interface Props {
  slug: string;
  name: string;
  zip: string;
  zipName?: string;
  /** "45 KB" */
  zipSize: string;
  /** Free for commercial use. */
  commercial: boolean;
  purchaseUrl?: string;
  lang: Lang;
}

const external = (url: string) => (url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {});

/** "Add to catalog" button with its popover (a bottom sheet on phones). */
function CatalogMenu({ slug, lang, className, up = false }: { slug: string; lang: Lang; className: string; up?: boolean }) {
  const t = useT(lang);
  const { catalogs } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inCount = catalogs.filter((c) => c.fonts.includes(slug)).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && !popRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // On phones the menu opens from the fixed action bar, whose backdrop-filter would trap a fixed
  // bottom sheet inside it: the sheet goes to <body> instead.
  const popover = (
    <>
      <div className="pop-scrim fixed inset-0 z-[68]" onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={popRef} role="dialog" aria-label={t('Жинаққа қосу')} className={`pop absolute right-0 z-[70] w-72 ${up ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'}`}>
        <p className="px-2.5 pt-1.5 pb-1 text-[13px] font-semibold text-fg-3">{t('Жинақтар')}</p>
        {catalogs.length === 0 && <p className="px-2.5 py-2 text-sm text-fg-3">{t('Әлі жинақ жоқ.')}</p>}
        {catalogs.map((c) => (
          <label key={c.id} className="pop-item cursor-pointer">
            <input type="checkbox" className="checkbox" checked={c.fonts.includes(slug)} onChange={() => store.toggleInCatalog(c.id, slug)} />
            <span className="min-w-0 flex-1 truncate">{c.name}</span>
            <span className="text-xs font-normal text-fg-3 tabular-nums">{c.fonts.length}</span>
          </label>
        ))}
        <form
          className="mt-1.5 flex gap-1.5 border-t border-line px-1 pt-2 pb-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            store.createCatalog(name.trim(), [slug]);
            setName('');
          }}
        >
          <input className="input h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Жаңа жинақ')} aria-label={t('Жаңа жинақ')} />
          <button type="submit" className="icon-btn size-10 bg-fill" aria-label={t('Құру')}>
            <Icon name="plus" size={17} />
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div ref={ref} className="relative">
      <button type="button" className={`relative ${className} ${inCount ? 'text-accent-ink' : 'text-fg'}`} aria-expanded={open} aria-haspopup="dialog" aria-label={t('Жинаққа қосу')} title={t('Жинаққа қосу')} onClick={() => setOpen((o) => !o)}>
        <Icon name="folderPlus" size={19} />
        {inCount > 0 && <span className="absolute -top-1 -right-1 inline-flex size-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent">{inCount}</span>}
      </button>
      {open && (up ? createPortal(popover, document.body) : popover)}
    </div>
  );
}

/**
 * Font page actions: favorite, add to catalog, buy, download (counted on the server and kept in
 * local history). Desktop: in the header, right. Phones: a bar fixed above the tab bar.
 * After a download a thank-you note appears under the header (portal into #dl-thanks).
 */
export default function FontActions({ slug, name, zip, zipName, zipSize, commercial, purchaseUrl, lang }: Props) {
  const t = useT(lang);
  const [done, setDone] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById('dl-thanks')), []);

  const onDownload = () => {
    store.recordDownload(slug);
    trackDownload(slug);
    setDone(true);
    setThanks(true);
  };
  const label = done ? t('Жүктелді') : commercial ? t('Тегін жүктеу') : t('Жүктеу');
  const download = (cls: string, size: number) => (
    <a href={zip} download={zipName ?? true} className={cls} onClick={onDownload}>
      <Icon name={done ? 'check' : 'download'} size={size} strokeWidth={2} />
      {label}
    </a>
  );

  return (
    <>
      <div className="hidden flex-col items-end gap-2.5 sm:flex">
        <div className="flex gap-2">
          <FavoriteButton slug={slug} lang={lang} name={name} variant="square" />
          <CatalogMenu slug={slug} lang={lang} className="inline-flex size-[46px] items-center justify-center rounded-xl bg-fill transition-colors hover:bg-fill-2" />
          {purchaseUrl && (
            <a href={purchaseUrl} className="btn-secondary btn-rect h-[46px]" {...external(purchaseUrl)}>
              <Icon name="cart" size={17} />
              {t('Сатып алу')}
            </a>
          )}
          {download('btn-primary btn-rect h-[46px] px-[22px]', 17)}
        </div>
        <span className="meta">
          ZIP · {zipSize} · {commercial ? t('кез келген жобаға тегін') : t('жеке жобаларға тегін')}
        </span>
      </div>

      {/* Phones: a bar above the tab bar. */}
      <div className="no-print fixed inset-x-0 bottom-[var(--tabbar-h)] z-[35] flex gap-2 border-t border-[var(--glass-line)] bg-[var(--glass)] px-4 py-2.5 backdrop-blur-xl backdrop-saturate-[1.8] sm:hidden">
        <FavoriteButton slug={slug} lang={lang} name={name} variant="square" className="size-12! rounded-[14px]! bg-fill-2!" />
        <CatalogMenu slug={slug} lang={lang} up className="inline-flex size-12 items-center justify-center rounded-[14px] bg-fill-2" />
        {purchaseUrl && (
          <a href={purchaseUrl} aria-label={t('Сатып алу')} className="inline-flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-fill-2 text-fg" {...external(purchaseUrl)}>
            <Icon name="cart" size={18} />
          </a>
        )}
        {download('btn-primary h-12! flex-1 rounded-[14px]! text-base!', 18)}
      </div>

      {thanks &&
        slot &&
        createPortal(
          <div role="status" className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-accent-soft py-4 pr-3 pl-5 text-sm text-fg-2">
            <span className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5">
              <b className="text-[15px] font-semibold text-fg">{t('Жүктелді. Ұнаса, Qarip-ті қолдаңыз')}</b>
              <span>{t('Сайт тегін және жарнамасыз. Қолдауыңыз жаңа қаріптерге қазақ әріптерін қосуға көмектеседі.')}</span>
            </span>
            <a href={localePath(lang, '/support')} className="btn-primary btn-sm h-10!">
              <Icon name="tenge" size={16} />
              {t('Қолдау көрсету')}
            </a>
            <button type="button" className="icon-btn size-8 rounded-lg text-fg-3" aria-label={t('Жабу')} onClick={() => setThanks(false)}>
              <Icon name="x" size={14} strokeWidth={2.2} />
            </button>
          </div>,
          slot,
        )}
    </>
  );
}
