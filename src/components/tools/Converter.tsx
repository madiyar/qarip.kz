import { useState } from 'react';
import { zipSync } from 'fflate';
import Dropzone from './Dropzone';
import Icon from '../ui/Icon';
import { downloadBytes, sfntExtension, sfntToWoff, toSfnt, toWoff2 } from '../../lib/sfnt';
import { baseName, formatSize } from './util';
import { type Lang, useT } from '../../i18n';

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

  return (
    <div className="space-y-6">
      <Dropzone t={t} multiple onFiles={(files) => setJobs((j) => [...j, ...files.map((file) => ({ file, status: 'pending' as const, results: [] }))])} title={t('Қаріптерді осында сүйреңіз немесе файлдарды таңдаңыз')} />

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-semibold">{t('Шығыс форматтары')}</span>
        {(
          [
            ['sfnt', 'TTF/OTF'],
            ['woff', 'WOFF'],
            ['woff2', 'WOFF2'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" className="chip" aria-pressed={targets[k]} onClick={() => setTargets((x) => ({ ...x, [k]: !x[k] }))}>
            {targets[k] && <Icon name="check" size={14} />}
            {label}
          </button>
        ))}
        <button type="button" className="btn-primary ml-auto" disabled={!jobs.length || !anyTarget || busy} onClick={convert}>
          <Icon name="repeat" size={16} />
          {busy ? t('Конвертацияланып жатыр...') : t('Конвертациялау')}
        </button>
      </div>

      {jobs.length > 0 && (
        <div className="card divide-y divide-line">
          {jobs.map((job, i) => (
            <div key={job.file.name + i} className="p-4">
              <div className="flex items-center gap-3">
                <Icon name="file" className="text-muted" />
                <span className="flex-1 truncate font-medium">{job.file.name}</span>
                <span className="badge bg-surface-2 uppercase">{detectFormatName(job.file.name)}</span>
                <span className="text-sm text-muted">{formatSize(job.file.size)}</span>
                {job.status === 'working' && <span className="text-sm text-muted">…</span>}
                <button type="button" className="icon-btn size-8" aria-label={t('Өшіру')} onClick={() => setJobs((j) => j.filter((_, k) => k !== i))}>
                  <Icon name="x" size={14} />
                </button>
              </div>
              {job.status === 'error' && <p className="mt-2 text-sm text-rose-500">{t('Файлды конвертациялау мүмкін болмады')}</p>}
              {job.results.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 pl-9">
                  {job.results.map((r) => (
                    <button key={r.name} type="button" className="chip" onClick={() => downloadBytes(r.bytes, r.name, mime(r.name))}>
                      <Icon name="download" size={14} />
                      {r.name.split('.').pop()!.toUpperCase()}
                      <span className="text-muted">{formatSize(r.bytes.length)}</span>
                      <span className={r.bytes.length < job.file.size ? 'text-emerald-500' : 'text-muted'}>
                        {Math.round((r.bytes.length / job.file.size - 1) * 100)}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {all.length > 1 && (
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => downloadBytes(zipSync(Object.fromEntries(all.map((r) => [r.name, r.bytes]))), 'qarip-fonts.zip', 'application/zip')}
        >
          <Icon name="download" size={16} />
          {t('Барлығын ZIP ретінде жүктеу')}
        </button>
      )}
    </div>
  );
}

const detectFormatName = (name: string) => name.split('.').pop() ?? '';
const mime = (name: string) => `font/${name.split('.').pop()}`;
