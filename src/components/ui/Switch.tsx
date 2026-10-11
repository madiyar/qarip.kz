interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** id of the visible label. */
  labelledBy?: string;
  label?: string;
}

/** On/off switch (role="switch"); the look is the `switch` class. */
export default function Switch({ checked, onChange, labelledBy, label }: Props) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : label} className="switch" onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}
