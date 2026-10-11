/** "Qarip" badge: the only marker of Qarip's own fonts (cards add .card-own). Works in .astro files too. */
export default function OwnBadge() {
  return (
    <span className="badge-own" title="Qarip">
      <svg width="11" height="11" viewBox="120 125 425 415" fill="currentColor" aria-hidden="true">
        <path d="M504.9 332.6A185 185 0 1 0 374.3 502A140 140 0 1 1 504.9 332.6Z" />
        <path d="M430 321Q441 412 531 423Q441 434 430 525Q419 434 329 423Q419 412 430 321Z" />
      </svg>
      Qarip
    </span>
  );
}
