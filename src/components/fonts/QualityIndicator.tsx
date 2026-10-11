/** Editorial quality, 1–10: a short bar (green ≥ 8, amber ≥ 5, red below) and the score. */
export default function QualityIndicator({ quality, label, wide = false }: { quality?: number; label?: string; wide?: boolean }) {
  if (!quality) return null;
  const value = Math.min(10, Math.max(1, Number(quality)));
  const color = value >= 8 ? 'bg-ok' : value >= 5 ? 'bg-warn' : 'bg-heart';
  return (
    <span className="inline-flex items-center gap-2 text-xs whitespace-nowrap text-fg-3 tabular-nums" title={`${label ?? ''} ${value}/10`.trim()}>
      {label}
      <span aria-hidden="true" className={`relative h-1 overflow-hidden rounded-full bg-fill-2 ${wide ? 'w-12' : 'w-10'}`}>
        <span className={`absolute inset-y-0 left-0 rounded-full ${color}`} style={{ width: `${value * 10}%` }} />
      </span>
      <span>{value}/10</span>
    </span>
  );
}
