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
