import React from 'react';
import { Clock, Trash2, TrendingUp } from 'lucide-react';
import { Course } from '../data/mockData';
import { ProgressBar } from './ProgressBar';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
  onDelete: () => void;
}

export function CourseCard({ course, onClick, onDelete }: CourseCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'var(--success)';
      case 'intermediate':
        return 'var(--accent-orange)';
      case 'advanced':
        return 'var(--error)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  return (
    <div
      onClick={onClick}
      className="rounded-lg p-6 cursor-pointer transition-all hover:shadow-md"
      style={{
        backgroundColor: 'var(--surface-0)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 
              className="mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {course.title}
            </h3>
            <p 
              className="text-sm line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {course.description}
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded-md transition-colors hover:bg-black/5"
            aria-label="Delete course"
          >
            <Trash2 className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        {/* Progress */}
        {course.progress > 0 && (
          <div>
            <ProgressBar value={course.progress} showLabel />
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              {course.estimatedDuration}h
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp 
              className="w-4 h-4" 
              style={{ color: getDifficultyColor(course.difficulty) }} 
            />
            <span 
              style={{ color: getDifficultyColor(course.difficulty) }}
            >
              {course.difficulty}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {course.status === 'completed' && (
            <span 
              className="inline-block px-2.5 py-1 rounded-md text-sm"
              style={{
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success)',
              }}
            >
              Completed
            </span>
          )}
          {course.status === 'in-progress' && (
            <span 
              className="inline-block px-2.5 py-1 rounded-md text-sm"
              style={{
                backgroundColor: 'var(--accent-orange-bg)',
                color: 'var(--accent-orange)',
              }}
            >
              In Progress
            </span>
          )}
          {course.status === 'not-started' && (
            <span 
              className="inline-block px-2.5 py-1 rounded-md text-sm"
              style={{
                backgroundColor: 'var(--surface-1)',
                color: 'var(--text-secondary)',
              }}
            >
              Not Started
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
