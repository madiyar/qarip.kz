import { useState } from 'react';
import Icon from './Icon';

export default function CopyButton({ text, label, done, className = 'btn-secondary h-9 px-3' }: { text: string; label: string; done: string; className?: string }) {
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

export function CodeBlock({ code, label, done }: { code: string; label: string; done: string }) {
  return (
    <div className="relative">
      <pre className="max-h-96 overflow-auto rounded-xl border border-line bg-bg p-4 pr-28 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={code} label={label} done={done} />
      </div>
    </div>
  );
}
