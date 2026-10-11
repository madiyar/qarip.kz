import { useState } from 'react';
import Icon from '../ui/Icon';

interface Props {
  url: string;
  title: string;
  label: string;
  copied: string;
  className?: string;
  /** Second line: turns the button into a tile (title + hint, no icon). */
  hint?: string;
}

/** Uses the native share sheet when available, otherwise copies the link. */
export default function ShareButton({ url, title, label, copied: copiedLabel, className = 'btn-primary', hint }: Props) {
  const [copied, setCopied] = useState(false);
  const text = copied ? copiedLabel : label;
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ url, title });
            return;
          } catch {}
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
    >
      {hint ? (
        <>
          <b className="font-name">{text}</b>
          <span className="text-sm font-normal text-fg-3">{hint}</span>
        </>
      ) : (
        <>
          <Icon name={copied ? 'check' : 'share'} size={16} />
          {text}
        </>
      )}
    </button>
  );
}
