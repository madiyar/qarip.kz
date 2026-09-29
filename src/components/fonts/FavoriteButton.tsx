import Icon from '../ui/Icon';
import { store, useStore } from '../../lib/store';
import { type Lang, useT } from '../../i18n';

export default function FavoriteButton({ slug, lang, large = false }: { slug: string; lang: Lang; large?: boolean }) {
  const t = useT(lang);
  const { favorites } = useStore();
  const active = favorites.includes(slug);
  const label = active ? t('Таңдаулылардан алу') : t('Таңдаулыларға қосу');
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        store.toggleFavorite(slug);
      }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={
        large
          ? `inline-flex size-11 items-center justify-center rounded-xl border border-line transition-colors hover:bg-surface-2 ${active ? 'text-rose-500' : ''}`
          : `icon-btn ${active ? 'text-rose-500 hover:text-rose-500' : ''}`
      }
    >
      <Icon name="heart" size={large ? 20 : 18} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
