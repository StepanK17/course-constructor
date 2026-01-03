import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { Source } from '../data/mockData';

interface SourcesViewProps {
  sources: Source[];
}

export function SourcesView({ sources }: SourcesViewProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2" style={{ color: 'var(--text-primary)' }}>
          Sources & References
        </h3>
        <p 
          className="text-sm mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          This lesson content was generated from the following sources. Click to explore the original materials.
        </p>
      </div>

      <div className="space-y-3">
        {sources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-lg transition-all hover:shadow-md group"
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="p-2 rounded-lg flex-shrink-0"
                style={{
                  backgroundColor: 'var(--accent-orange-bg)',
                }}
              >
                <FileText className="w-5 h-5" style={{ color: 'var(--accent-orange)' }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="text-xs px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: 'var(--bg-0)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {source.domain}
                  </span>
                </div>
                
                <h4 
                  className="mb-1 group-hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {source.title}
                </h4>
                
                <p 
                  className="text-sm line-clamp-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {source.annotation}
                </p>
              </div>

              <ExternalLink 
                className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-tertiary)' }}
              />
            </div>
          </a>
        ))}
      </div>

      {sources.length === 0 && (
        <div 
          className="p-8 rounded-lg text-center"
          style={{
            backgroundColor: 'var(--surface-1)',
          }}
        >
          <p style={{ color: 'var(--text-secondary)' }}>
            No sources available for this lesson.
          </p>
        </div>
      )}
    </div>
  );
}
