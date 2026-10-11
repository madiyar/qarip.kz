import type { CSSProperties } from 'react';

/**
 * Placeholder block shown while something loads (an island, a font file).
 * Give it the size of what it stands for, so the page does not move when the content arrives.
 * Works in .astro files too (no client directive needed).
 */
export default function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} style={style} />;
}
