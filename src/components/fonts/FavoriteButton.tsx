import Icon from '../ui/Icon';
import { store } from '../../lib/store';
import { useStore } from '../../lib/useStore';
import { type Lang, useT } from '../../i18n';

interface Props {
  slug: string;
  lang: Lang;
  /** Font name for the screen-reader label. */
  name?: string;
  /** "square": 46px filled button (font page actions); default: round icon button in cards and rows. */
  variant?: 'round' | 'square';
  className?: string;
}

export default function FavoriteButton({ slug, lang, name, variant = 'round', className = '' }: Props) {
  const t = useT(lang);
  const { favorites } = useStore();
  const active = favorites.includes(slug);
  const label = name ? (active ? t('{name} таңдаулыдан алу', { name }) : t('{name} таңдаулыға қосу', { name })) : active ? t('Таңдаулыдан алу') : t('Таңдаулыға қосу');
  const look =
    variant === 'square'
      ? `size-[46px] rounded-xl bg-fill hover:bg-fill-2 ${active ? 'text-heart' : 'text-fg'}`
      : `size-10 rounded-full hover:bg-fill ${active ? 'text-heart' : 'text-fg-3 hover:text-fg'}`;
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
      className={`inline-flex shrink-0 items-center justify-center transition-colors ${look} ${className}`}
    >
      <Icon name="heart" size={variant === 'square' ? 20 : 19} strokeWidth={1.8} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
