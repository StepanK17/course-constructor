import React from 'react';
import { BookOpen, Code, CircleCheck } from 'lucide-react';
import { LessonType } from '../data/mockData';

interface ChipProps {
  type: LessonType;
  size?: 'sm' | 'md';
}

export function Chip({ type, size = 'sm' }: ChipProps) {
  const getIcon = () => {
    switch (type) {
      case 'theory':
        return <BookOpen className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'practice':
        return <Code className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'quiz':
        return <CircleCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      default:
        return <BookOpen className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
    }
  };

  const getLabel = () => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const baseStyles = 'inline-flex items-center gap-1 rounded-md border';
  const sizeStyles = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-sm';

  return (
    <span 
      className={`${baseStyles} ${sizeStyles}`}
      style={{
        backgroundColor: 'var(--surface-1)',
        borderColor: 'var(--border-default)',
        color: 'var(--text-secondary)',
      }}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </span>
  );
}