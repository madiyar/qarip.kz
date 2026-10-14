import Select from './Select';

/** Ready-made type sizes; each picker offers the ones inside its slider's range. */
const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120, 144, 160, 200, 240];

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}

/** The "24 px" next to a size slider: shows the current size and opens a list of ready sizes. */
export default function SizeSelect({ value, min, max, onChange, label }: Props) {
  return (
    <Select<number>
      label={label}
      value={value}
      onChange={onChange}
      options={SIZES.filter((v) => v >= min && v <= max).map((v) => ({ value: v, label: `${v} px` }))}
      placeholder={`${value} px`}
      alignRight
      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg pr-1 pl-1.5 text-sm font-medium whitespace-nowrap text-fg-2 tabular-nums transition-colors hover:bg-fill hover:text-fg"
    />
  );
}
