import { useState } from 'react';
import Icon from './Icon';

export default function CopyButton({ text, label, done, className = 'btn-secondary btn-sm btn-rect' }: { text: string; label: string; done: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
    >
      <Icon name={copied ? 'check' : 'copy'} size={15} />
      {copied ? done : label}
    </button>
  );
}

/** Code in a panel with a title bar and a copy button. */
export function CodeBlock({ code, label, done, title }: { code: string; label: string; done: string; title?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-elev">
      <div className="flex items-center justify-between gap-3 border-b border-line py-2 pr-2 pl-4 text-[13px] text-fg-3">
        <span>{title}</span>
        <CopyButton text={code} label={label} done={done} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-fill px-3 text-[13px] font-medium text-fg hover:bg-fill-2" />
      </div>
      <pre className="max-h-96 overflow-auto p-4 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap text-fg-2 [overflow-wrap:anywhere]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
