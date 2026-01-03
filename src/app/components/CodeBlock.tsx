import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="relative rounded-lg overflow-hidden my-4"
      style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
      }}
    >
      {language && (
        <div 
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--bg-1)',
          }}
        >
          <span 
            className="text-xs uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {language}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/50 transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />
            ) : (
              <Copy className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            )}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code 
          className="text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}
