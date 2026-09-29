import { useEffect, useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import { FontRow } from '../fonts/FontRow';
import PreviewToolbar from '../fonts/PreviewToolbar';
import { usePreview } from '../fonts/usePreview';
import { store, useStore } from '../../lib/store';
import { type Lang, localePath, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';

interface Props {
  fonts: FontSummary[];
  lang: Lang;
}

export default function Profile({ fonts, lang }: Props) {
  const t = useT(lang);
  const { favorites, downloads, catalogs } = useStore();
  const [preview, setPreview] = usePreview('profile', { text: '', size: 28, textCase: 'none', view: 'list' });
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [shared, setShared] = useState<{ name: string; fonts: string[] } | null>(null);
  const [copied, setCopied] = useState('');
  const bySlug = useMemo(() => Object.fromEntries(fonts.map((f) => [f.slug, f])), [fonts]);

  // A catalog shared by link: /profile?catalog=Name&fonts=a,b,c
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const list = p.get('fonts')?.split(',').filter((s) => s in bySlug);
    if (list?.length) setShared({ name: p.get('catalog') || t('Ортақ каталог'), fonts: list });
  }, [bySlug]);

  const favFonts = favorites.map((s) => bySlug[s]).filter(Boolean);
  const history = downloads.filter((d) => bySlug[d.slug]);

  const shareUrl = (name: string, list: string[]) =>
    `${window.location.origin}${localePath(lang, '/profile')}?catalog=${encodeURIComponent(name)}&fonts=${list.join(',')}`;

  const stats = [
    { n: favorites.length, label: t('Таңдаулы'), icon: 'heart' as const, href: '#favorites' },
    { n: downloads.length, label: t('Жүктеу'), icon: 'download' as const, href: '#downloads' },
    { n: catalogs.length, label: t('Каталог'), icon: 'folder' as const, href: '#catalogs' },
  ];

  return (
    <div className="space-y-12">
      {shared && (
        <div className="card flex flex-wrap items-center gap-4 border-accent p-5">
          <Icon name="folder" className="text-accent" />
          <div className="flex-1">
            <p className="font-semibold">{shared.name}</p>
            <p className="text-sm text-muted">{shared.fonts.map((s) => bySlug[s].name).join(', ')}</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              store.createCatalog(shared.name, shared.fonts);
              setShared(null);
              window.history.replaceState(null, "", window.location.pathname);
            }}
          >
            {t('Каталогты сақтау')}
          </button>
          <button type="button" className="icon-btn" onClick={() => setShared(null)} aria-label={t('Жабу')}>
            <Icon name="x" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <a key={s.label} href={s.href} className="card p-5 transition-colors hover:border-muted">
            <Icon name={s.icon} className="text-muted" />
            <p className="mt-3 text-3xl font-bold tabular-nums">{s.n}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </a>
        ))}
      </div>

      <section id="favorites" className="scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold">
          {t('Таңдаулылар')} <span className="text-muted">({favFonts.length})</span>
        </h2>
        {favFonts.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Icon name="heart" size={28} className="text-muted" />
            <p className="text-muted">{t('Әлі таңдаулы қаріп жоқ. Қаріптердің жанындағы жүрекке басыңыз.')}</p>
            <a className="btn-secondary" href={localePath(lang, '/fonts')}>
              {t('Қаріптерге өту')}
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <PreviewToolbar t={t} state={preview} onChange={setPreview} showView={false} />
            {favFonts.map((f) => (
              <FontRow key={f.slug} font={f} lang={lang} preview={preview} />
            ))}
          </div>
        )}
      </section>

      <section id="downloads" className="scroll-mt-24">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {t('Жүктеу тарихы')} <span className="text-muted">({history.length})</span>
          </h2>
          {history.length > 0 && (
            <button type="button" className="btn-ghost h-9 text-muted" onClick={() => store.clearDownloads()}>
              <Icon name="trash" size={15} />
              {t('Тазалау')}
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="card px-6 py-10 text-center text-muted">{t('Жүктеу тарихы бос. Қаріп жүктегенде осында пайда болады.')}</p>
        ) : (
          <ul className="card divide-y divide-line">
            {history.map((d, i) => (
              <li key={d.at + i} className="flex items-center gap-4 px-5 py-3">
                <a href={localePath(lang, `/fonts/${d.slug}`)} className="flex-1 truncate text-xl hover:text-accent" style={{ fontFamily: `'qf-${d.slug}', system-ui` }}>
                  {bySlug[d.slug].name}
                </a>
                <time className="text-sm text-muted">{new Date(d.at).toLocaleString(lang === 'kk' ? 'kk-KZ' : 'en-GB')}</time>
                <a href={bySlug[d.slug].zip} download className="icon-btn" aria-label={t('Қайта жүктеу')} onClick={() => store.recordDownload(d.slug)}>
                  <Icon name="download" size={16} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="catalogs" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">
            {t('Каталогтар')} <span className="text-muted">({catalogs.length})</span>
          </h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              store.createCatalog(newName.trim());
              setNewName('');
            }}
          >
            <input className="input h-10 w-56" placeholder={t('Каталог атауы')} value={newName} onChange={(e) => setNewName(e.target.value)} aria-label={t('Каталог атауы')} />
            <button type="submit" className="btn-primary h-10">
              <Icon name="plus" size={16} />
              {t('Құру')}
            </button>
          </form>
        </div>
        {catalogs.length === 0 ? (
          <p className="card px-6 py-10 text-center text-muted">{t('Әлі каталог жоқ. Жаңа каталог құрып, қаріптерді жинақтаңыз.')}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {catalogs.map((c) => (
              <div key={c.id} className="card p-5">
                <div className="flex items-center gap-2">
                  <Icon name="folder" className="text-accent" />
                  {editing === c.id ? (
                    <input
                      autoFocus
                      className="input h-9 flex-1"
                      defaultValue={c.name}
                      onBlur={(e) => {
                        if (e.target.value.trim()) store.renameCatalog(c.id, e.target.value.trim());
                        setEditing(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    />
                  ) : (
                    <h3 className="flex-1 truncate font-semibold">{c.name}</h3>
                  )}
                  <span className="text-sm text-muted">{c.fonts.length}</span>
                  <button type="button" className="icon-btn size-8" onClick={() => setEditing(c.id)} aria-label={t('Атын өзгерту')}>
                    <Icon name="pencil" size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn size-8"
                    disabled={!c.fonts.length}
                    onClick={async () => {
                      await navigator.clipboard?.writeText(shareUrl(c.name, c.fonts));
                      setCopied(c.id);
                      setTimeout(() => setCopied(''), 1500);
                    }}
                    aria-label={t('Сілтемені көшіру')}
                    title={t('Сілтемені көшіру')}
                  >
                    <Icon name={copied === c.id ? 'check' : 'share'} size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn size-8 hover:text-rose-500"
                    onClick={() => confirm(t('Каталогты өшіру керек пе?')) && store.deleteCatalog(c.id)}
                    aria-label={t('Өшіру')}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
                {c.fonts.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">{t('Қаріп бетіндегі «Каталогқа» батырмасы арқылы қаріп қосыңыз.')}</p>
                ) : (
                  <ul className="mt-4 space-y-1">
                    {c.fonts
                      .filter((s) => bySlug[s])
                      .map((s) => (
                        <li key={s} className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-2">
                          <a href={localePath(lang, `/fonts/${s}`)} className="flex-1 truncate text-2xl" style={{ fontFamily: `'qf-${s}', system-ui` }}>
                            {bySlug[s].name}
                          </a>
                          <button type="button" className="icon-btn size-7 opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={() => store.toggleInCatalog(c.id, s)} aria-label={t('Каталогтан алу')}>
                            <Icon name="x" size={14} />
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-2 text-center text-sm text-muted">
        <Icon name="lock" size={14} />
        {t('Каталогтар мен таңдаулылар тек осы браузерде сақталады, серверге жіберілмейді')}
      </p>
    </div>
  );
}
