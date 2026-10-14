import { useState } from 'react';
import Icon from '../ui/Icon';
import CopyButton from '../ui/CopyButton';

/** A bank card from src/data/donation.json (CMS: Анықтамалықтар → Қолдау картасы). */
export interface DonationCardInfo {
  bank: string;
  number: string;
  holder?: string;
}

interface Props {
  cards: DonationCardInfo[];
  labels: { title: string; bank: string; number: string; holder: string; copy: string; copied: string; note: string };
}

const digits = (n: string) => n.replace(/\D/g, '');
/** "4400430112345678" → "4400 4301 1234 5678". */
const grouped = (n: string) => digits(n).replace(/(\d{4})(?=\d)/g, '$1 ');

/** Support page: the donation card; several cards switch with bank tabs. */
export default function DonationCard({ cards, labels }: Props) {
  const [current, setCurrent] = useState(0);
  const card = cards[current] ?? cards[0];
  const tabs = cards.length > 1;
  return (
    <div id="donate" className="card card-own sticky top-[calc(var(--header-h)+2rem)] flex w-full flex-col gap-4 !rounded-3xl p-6 max-sm:static sm:max-w-[420px] sm:flex-[1_1_340px]">
      <div className="flex items-center gap-2.5 text-accent-ink">
        <Icon name="tenge" size={20} />
        <b className="text-lg font-[650] text-fg">{labels.title}</b>
      </div>
      {tabs && (
        <div role="group" aria-label={labels.bank} className="segmented flex">
          {cards.map((c, i) => (
            <button key={c.bank + i} type="button" aria-pressed={i === current} className="h-9! flex-1" onClick={() => setCurrent(i)}>
              {c.bank}
            </button>
          ))}
        </div>
      )}
      <div className="note p-[18px]">
        <span className="meta block">{tabs ? labels.number : `${card.bank} · ${labels.number}`}</span>
        <span className="mt-1 mb-2.5 block font-mono text-[22px] font-medium tracking-[0.02em] tabular-nums">{grouped(card.number)}</span>
        {card.holder && (
          <>
            <span className="meta block">{labels.holder}</span>
            <span className="mt-0.5 block font-semibold">{card.holder}</span>
          </>
        )}
      </div>
      <CopyButton key={current} text={digits(card.number)} label={labels.copy} done={labels.copied} className="btn-primary btn-lg rounded-[14px]!" />
      <p className="meta leading-normal">{labels.note}</p>
    </div>
  );
}
