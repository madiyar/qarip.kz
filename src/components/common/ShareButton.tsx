import { useState } from 'react';
import Icon from '../ui/Icon';

/** Uses the native share sheet when available, otherwise copies the link. */
export default function ShareButton({ url, title, label, copied: copiedLabel, className = 'btn-primary' }: { url: string; title: string; label: string; copied: string; className?: string }) {
  const [copied, setCopied] = useState(false);
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
      <Icon name={copied ? 'check' : 'share'} size={16} />
      {copied ? copiedLabel : label}
    </button>
  );
}
