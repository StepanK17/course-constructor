import React from 'react';
import { CodeBlock } from './CodeBlock';

interface TheoryViewProps {
  content: string;
}

export function TheoryView({ content }: TheoryViewProps) {
  // Simple markdown-like parser
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentCodeBlock: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';

    lines.forEach((line, index) => {
      // Code block detection
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.substring(3).trim() || 'text';
        } else {
          elements.push(
            <CodeBlock 
              key={`code-${index}`}
              code={currentCodeBlock.join('\n')}
              language={codeLanguage}
            />
          );
          currentCodeBlock = [];
          inCodeBlock = false;
          codeLanguage = '';
        }
        return;
      }

      if (inCodeBlock) {
        currentCodeBlock.push(line);
        return;
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="mb-4" style={{ color: 'var(--text-primary)' }}>
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="mb-3 mt-8" style={{ color: 'var(--text-primary)' }}>
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="mb-2 mt-6" style={{ color: 'var(--text-primary)' }}>
            {line.substring(4)}
          </h3>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={index} className="h-4" />);
      } else if (line.startsWith('- ')) {
        // List items
        elements.push(
          <li 
            key={index} 
            className="ml-6 mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {line.substring(2)}
          </li>
        );
      } else {
        // Regular paragraph
        elements.push(
          <p 
            key={index} 
            className="mb-4 leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
          >
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div 
      className="prose max-w-none"
      style={{
        lineHeight: 'var(--leading-relaxed)',
      }}
    >
      {renderContent()}
    </div>
  );
}
