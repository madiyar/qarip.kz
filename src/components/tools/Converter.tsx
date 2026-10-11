import { useState } from 'react';
import { zipSync } from 'fflate';
import Dropzone from './Dropzone';
import Icon from '../ui/Icon';
import { downloadBytes, sfntExtension, sfntToWoff, toSfnt, toWoff2 } from '../../lib/sfnt';
import { baseName, formatSize } from './util';
import { type Lang, localePath, useT } from '../../i18n';

type Out = 'sfnt' | 'woff' | 'woff2';
interface Result {
  name: string;
  bytes: Uint8Array;
}
interface Job {
  file: File;
  status: 'pending' | 'working' | 'done' | 'error';
  results: Result[];
  error?: string;
}

export default function Converter({ lang }: { lang: Lang }) {
  const t = useT(lang);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [targets, setTargets] = useState<Record<Out, boolean>>({ sfnt: false, woff: true, woff2: true });
  const [busy, setBusy] = useState(false);

  const convert = async () => {
    setBusy(true);
    const next = [...jobs];
    for (let i = 0; i < next.length; i++) {
      next[i] = { ...next[i], status: 'working', results: [] };
      setJobs([...next]);
      try {
        const input = await next[i].file.arrayBuffer();
        const sfnt = await toSfnt(input);
        const base = baseName(next[i].file.name);
        const results: Result[] = [];
        if (targets.sfnt) results.push({ name: `${base}.${sfntExtension(sfnt)}`, bytes: new Uint8Array(sfnt) });
        if (targets.woff) results.push({ name: `${base}.woff`, bytes: sfntToWoff(new Uint8Array(sfnt)) });
        if (targets.woff2) results.push({ name: `${base}.woff2`, bytes: await toWoff2(sfnt) });
        next[i] = { ...next[i], status: 'done', results };
      } catch (e) {
        next[i] = { ...next[i], status: 'error', error: String(e) };
      }
      setJobs([...next]);
    }
    setBusy(false);
  };

  const all = jobs.flatMap((j) => j.results);
  const anyTarget = Object.values(targets).some(Boolean);
  const done = jobs.length > 0 && jobs.every((j) => j.status === 'done' || j.status === 'error');
  const zipAll = () =>
    all.length === 1
      ? downloadBytes(all[0].bytes, all[0].name, mime(all[0].name))
      : downloadBytes(zipSync(Object.fromEntries(all.map((r) => [r.name, r.bytes]))), 'qarip-fonts.zip', 'application/zip');

  return (
    <div className="flex flex-col gap-3.5">
      <Dropzone t={t} multiple onFiles={(files) => setJobs((j) => [...j, ...files.map((file) => ({ file, status: 'pending' as const, results: [] }))])} compact />

      {jobs.length > 0 && (
        <div className="panel overflow-hidden">
          {jobs.map((job, i) => (
            <div key={job.file.name + i} className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-line px-[18px] py-3.5 last:border-0">
              <span className="inline-flex h-[30px] min-w-[46px] items-center justify-center rounded-lg bg-fill px-1.5 font-mono text-xs font-medium text-fg-2 uppercase">{detectFormatName(job.file.name)}</span>
              <span className="min-w-0 flex-[1_1_200px] truncate font-medium">{job.file.name}</span>
              <span className="text-sm text-fg-3 tabular-nums">{formatSize(job.file.size)}</span>
              {job.status === 'working' && <span className="meta">{t('Түрлендіріліп жатыр…')}</span>}
              {job.status === 'error' && <span className="text-sm font-medium text-heart">{t('Файлды конвертациялау мүмкін болмады')}</span>}
              {job.results.map((r) => (
                <button key={r.name} type="button" className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-fill px-3 text-[13px] font-medium transition-colors hover:bg-fill-2" onClick={() => downloadBytes(r.bytes, r.name, mime(r.name))}>
                  <Icon name="download" size={14} strokeWidth={2} />
                  {r.name.split('.').pop()!.toUpperCase()}
                  <span className={`tabular-nums ${r.bytes.length < job.file.size ? 'text-ok' : 'text-fg-3'}`}>{formatSize(r.bytes.length)}</span>
                </button>
              ))}
              <button type="button" className="icon-btn size-[30px] rounded-lg text-fg-3" aria-label={t('Өшіру')} onClick={() => setJobs((j) => j.filter((_, k) => k !== i))}>
                <Icon name="x" size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="panel flex flex-wrap items-center gap-2.5 p-[18px]">
        <span className="mr-1.5 font-semibold">{t('Қай форматқа')}</span>
        {(
          [
            ['woff2', 'WOFF2'],
            ['woff', 'WOFF'],
            ['sfnt', 'TTF/OTF'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" className="chip" aria-pressed={targets[k]} onClick={() => setTargets((x) => ({ ...x, [k]: !x[k] }))}>
            {targets[k] && <Icon name="check" size={13} strokeWidth={3} />}
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {done && all.length > 0 ? (
          <>
            <button type="button" className="btn-primary btn-lg btn-rect" onClick={zipAll}>
              <Icon name="download" size={18} strokeWidth={2} />
              {all.length === 1 ? t('Жүктеу') : t('Барлығын ZIP-пен жүктеу')}
            </button>
            <button type="button" className="btn-secondary btn-lg btn-rect font-medium" onClick={() => setJobs([])}>
              {t('Қайта бастау')}
            </button>
          </>
        ) : (
          <button type="button" className="btn-primary btn-lg btn-rect" disabled={!jobs.length || !anyTarget || busy} onClick={convert}>
            {busy ? t('Түрлендіріліп жатыр…') : jobs.length ? t('Түрлендіру · {n} файл', { n: jobs.length }) : t('Түрлендіру')}
          </button>
        )}
        <span className="meta">{t('Өңдеу браузерде жүреді, серверге ештеңе жүктелмейді')}</span>
      </div>

      <section className="mt-12 grid gap-3 sm:grid-cols-2">
        <div className="note p-[18px]">
          <b className="font-semibold">{t('Қай форматты таңдау керек?')}</b>
          <p className="mt-1.5 text-sm text-fg-2">{t('Сайтқа — WOFF2. Компьютерге орнатуға — OTF немесе TTF.')}</p>
        </div>
        <div className="note p-[18px]">
          <b className="font-semibold">{t('Лицензияны тексеріңіз')}</b>
          <p className="mt-1.5 text-sm text-fg-2">
            {t('Кейбір лицензиялар қаріпті сайтқа енгізуге тыйым салады.')}{' '}
            <a className="link" href={localePath(lang, '/licenses')}>
              {t('Толығырақ')}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

const detectFormatName = (name: string) => name.split('.').pop() ?? '';
const mime = (name: string) => `font/${name.split('.').pop()}`;
