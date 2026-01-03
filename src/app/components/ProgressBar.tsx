import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ value, showLabel = false, size = 'md' }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const heightMap = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Progress
          </span>
          <span 
            className="text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
      <div 
        className={`w-full ${heightMap[size]} rounded-full overflow-hidden`}
        style={{ backgroundColor: 'var(--surface-1)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: 'var(--accent-orange)',
          }}
        />
      </div>
    </div>
  );
}
