import type { CSSProperties } from 'react';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
}

/** Slider in the site's style: the part before the thumb is filled with the accent colour. */
export default function Range({ value, min, max, step = 1, onChange, label, className = '' }: Props) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      className={`range ${className}`}
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      style={{ '--pct': `${Math.min(100, Math.max(0, pct))}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/** Slider with a label on the left and the current value on the right (tool settings). */
export function RangeField({ label, display, ...props }: Props & { display?: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="flex justify-between gap-3 text-[13px] text-fg-3">
        <span className="truncate">{label}</span>
        <span className="font-medium text-fg-2 tabular-nums">{display ?? props.value}</span>
      </span>
      <Range {...props} label={label} className={`w-full ${props.className ?? ''}`} />
    </label>
  );
}
