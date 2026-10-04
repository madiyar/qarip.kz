/** Quality marker on a red → green scale: 1 is poor, 10 is excellent. */
export default function QualityIndicator({ quality, label }: { quality?: number; label?: string }) {
  const value = Math.min(10, Math.max(1, Number(quality) || 0));
  if (!quality) return null;
  return (
    <span className="inline-flex items-center gap-2" title={`${label ?? ''} ${value}/10`.trim()}>
      <span className="relative h-1.5 w-16 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500 sm:w-20" role="img" aria-label={`${value}/10`}>
        <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-500 bg-white shadow" style={{ left: `${((value - 1) / 9) * 100}%` }} />
      </span>
      {label && (
        <span className="text-xs whitespace-nowrap text-muted">
          {label} {value}/10
        </span>
      )}
    </span>
  );
}
