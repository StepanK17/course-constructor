import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Course } from '../data/mockData';
import { Button } from '../components/ui/button';
import { TheoryView } from '../components/TheoryView';

interface CourseTextViewProps {
  course: Course;
  content: string;
  loading: boolean;
  status: 'pending' | 'ready';
  onBack: () => void;
}

export function CourseTextView({ course, content, loading, status, onBack }: CourseTextViewProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-0)' }}>
      <div className="border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {course.title}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {course.status === 'completed' ? 'Generated' : 'Generating'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border-default)',
            }}
          >
            {loading && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading course content...
              </p>
            )}

            {!loading && status === 'pending' && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Course is still generating. This page will update automatically.
              </p>
            )}

            {!loading && status === 'ready' && content && <TheoryView content={content} />}
          </div>
        </div>
      </div>
    </div>
  );
}
