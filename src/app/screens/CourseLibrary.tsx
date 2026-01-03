import React from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Course } from '../data/mockData';
import { CourseCard } from '../components/CourseCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface CourseLibraryProps {
  courses: Course[];
  loading?: boolean;
  onCourseSelect: (courseId: string) => void;
  onCreateCourse: () => void;
  onDeleteCourse: (courseId: string) => void;
}

export function CourseLibrary({ courses, loading = false, onCourseSelect, onCreateCourse, onDeleteCourse }: CourseLibraryProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = React.useState<string>('all');

  const filteredCourses = React.useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      const matchesDifficulty = difficultyFilter === 'all' || course.difficulty === difficultyFilter;
      
      return matchesSearch && matchesStatus && matchesDifficulty;
    });
  }, [courses, searchQuery, statusFilter, difficultyFilter]);

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-1)' }}
    >
      {/* Header */}
      <div 
        className="border-b"
        style={{ 
          backgroundColor: 'var(--bg-0)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 style={{ color: 'var(--text-primary)' }}>
                My Courses
              </h1>
              <p 
                className="mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Continue learning or start a new course
              </p>
            </div>
            <Button
              onClick={onCreateCourse}
              style={{
                backgroundColor: 'var(--accent-orange)',
                color: 'white',
              }}
              className="gap-2 hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: 'var(--border-default)',
                }}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger 
                className="w-[180px]"
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger 
                className="w-[180px]"
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div
            className="text-center py-16 rounded-lg"
            style={{ backgroundColor: 'var(--surface-0)' }}
          >
            <p style={{ color: 'var(--text-secondary)' }}>
              Loading courses...
            </p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div 
            className="text-center py-16 rounded-lg"
            style={{ backgroundColor: 'var(--surface-0)' }}
          >
            <p style={{ color: 'var(--text-secondary)' }}>
              No courses found. Try adjusting your filters or create a new course.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => onCourseSelect(course.id)}
                onDelete={() => onDeleteCourse(course.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
