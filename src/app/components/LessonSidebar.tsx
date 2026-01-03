import React from 'react';
import { ChevronDown, ChevronRight, Circle, CircleCheck, CirclePlay, Search } from 'lucide-react';
import { Module, Lesson } from '../data/mockData';
import { Chip } from './Chip';
import { Input } from './ui/input';

interface LessonSidebarProps {
  modules: Module[];
  currentLessonId?: string;
  onLessonSelect: (lessonId: string) => void;
}

export function LessonSidebar({ modules, currentLessonId, onLessonSelect }: LessonSidebarProps) {
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(
    new Set(modules.map(m => m.id))
  );
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    setExpandedModules(new Set(modules.map(m => m.id)));
  }, [modules]);

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getStatusIcon = (status: Lesson['status']) => {
    switch (status) {
      case 'completed':
        return <CircleCheck className="w-4 h-4" style={{ color: 'var(--success)' }} />;
      case 'in-progress':
        return <CirclePlay className="w-4 h-4" style={{ color: 'var(--accent-orange)' }} />;
      default:
        return <Circle className="w-4 h-4" style={{ color: 'var(--border-strong)' }} />;
    }
  };

  const filterLessons = (lessons: Lesson[]) => {
    if (!searchQuery) return lessons;
    return lessons.filter(lesson =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div 
      className="h-full flex flex-col"
      style={{ backgroundColor: 'var(--sidebar)' }}
    >
      {/* Search */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <Input
            type="text"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            style={{
              backgroundColor: 'var(--bg-0)',
              borderColor: 'var(--border-default)',
            }}
          />
        </div>
      </div>

      {/* Module & Lesson List */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((module) => {
          const isExpanded = expandedModules.has(module.id);
          const filteredLessons = filterLessons(module.lessons);
          
          if (searchQuery && filteredLessons.length === 0) return null;

          return (
            <div key={module.id}>
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/50 transition-colors"
                style={{
                  borderBottom: '1px solid var(--sidebar-border)',
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                )}
                <span 
                  className="flex-1 text-left text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {module.title}
                </span>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--surface-1)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {module.lessons.length}
                </span>
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div>
                  {filteredLessons.map((lesson) => {
                    const isActive = lesson.id === currentLessonId;
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onLessonSelect(lesson.id)}
                        className="w-full flex items-start gap-3 px-4 py-3 pl-8 hover:bg-white/50 transition-colors"
                        style={{
                          backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                          borderLeft: isActive ? '3px solid var(--accent-orange)' : '3px solid transparent',
                        }}
                      >
                        <div className="pt-0.5">
                          {getStatusIcon(lesson.status)}
                        </div>
                        <div className="flex-1 text-left space-y-1.5">
                          <div 
                            className="text-sm"
                            style={{ 
                              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}
                          >
                            {lesson.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip type={lesson.type} size="sm" />
                            <span 
                              className="text-xs"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              {lesson.duration} min
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
