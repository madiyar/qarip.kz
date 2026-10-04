export interface PathCommand {
  type: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

/**
 * SVG path data for opentype.js path commands.
 * opentype.js' own toPathData() can glue coordinates together ("42.4 0" → "42.40"),
 * which silently cuts the outline short, so paths are serialised here instead.
 */
export function pathData(commands: PathCommand[], decimals = 1): string {
  const k = 10 ** decimals;
  const n = (v?: number) => (Math.round((v ?? 0) * k) / k).toString();
  return commands
    .map((c) => {
      if (c.type === 'M' || c.type === 'L') return `${c.type}${n(c.x)} ${n(c.y)}`;
      if (c.type === 'Q') return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
      if (c.type === 'C') return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
      return 'Z';
    })
    .join('');
}
