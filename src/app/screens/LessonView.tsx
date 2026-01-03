import React from 'react';
import { ArrowLeft, ArrowRight, Settings, Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Course, Lesson, Module } from '../data/mockData';
import { LessonSidebar } from '../components/LessonSidebar';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { TheoryView } from '../components/TheoryView';
import { PracticeView } from '../components/PracticeView';
import { QuizView } from '../components/QuizView';
import { SourcesView } from '../components/SourcesView';

interface LessonViewProps {
  course: Course;
  modules: Module[];
  currentLesson: Lesson;
  onBack: () => void;
  onLessonChange: (lessonId: string) => void;
  onLessonComplete: (lessonId: string) => void;
}

export function LessonView({
  course,
  modules,
  currentLesson,
  onBack,
  onLessonChange,
  onLessonComplete,
}: LessonViewProps) {
  const [focusMode, setFocusMode] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>('theory');

  const allLessons = modules.flatMap(m => m.lessons);
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < allLessons.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onLessonChange(allLessons[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onLessonChange(allLessons[currentIndex + 1].id);
    }
  };

  const handleComplete = () => {
    onLessonComplete(currentLesson.id);
    if (canGoNext) {
      handleNext();
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-0)' }}>
      {/* Top Bar */}
      <div 
        className="border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 max-w-md">
              <h2 className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                {course.title}
              </h2>
              <ProgressBar value={course.progress} size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFocusMode(!focusMode)}
            >
              {focusMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              style={{
                backgroundColor: 'var(--accent-orange)',
                color: 'white',
              }}
              onClick={handleNext}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!focusMode && (
          <div 
            className="w-80 border-r flex-shrink-0 overflow-hidden"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <LessonSidebar
              modules={modules}
              currentLessonId={currentLesson.id}
              onLessonSelect={onLessonChange}
            />
          </div>
        )}

        {/* Lesson Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-8 py-8">
              {/* Lesson Header */}
              <div className="mb-8">
                <h1 style={{ color: 'var(--text-primary)' }}>
                  {currentLesson.title}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {currentLesson.duration} minutes
                  </span>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    •
                  </span>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Lesson {currentIndex + 1} of {allLessons.length}
                  </span>
                </div>
              </div>

              {/* Tabbed Content */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  {currentLesson.theory && (
                    <TabsTrigger value="theory">Theory</TabsTrigger>
                  )}
                  {currentLesson.practice && (
                    <TabsTrigger value="practice">Practice</TabsTrigger>
                  )}
                  {currentLesson.quiz && (
                    <TabsTrigger value="quiz">Quiz</TabsTrigger>
                  )}
                  {currentLesson.sources.length > 0 && (
                    <TabsTrigger value="sources">Sources</TabsTrigger>
                  )}
                </TabsList>

                {currentLesson.theory && (
                  <TabsContent value="theory">
                    <TheoryView content={currentLesson.theory} />
                  </TabsContent>
                )}

                {currentLesson.practice && (
                  <TabsContent value="practice">
                    <PracticeView 
                      practice={currentLesson.practice}
                      onSubmit={(answer) => console.log('Practice submitted:', answer)}
                    />
                  </TabsContent>
                )}

                {currentLesson.quiz && (
                  <TabsContent value="quiz">
                    <QuizView 
                      questions={currentLesson.quiz}
                      onComplete={() => console.log('Quiz completed')}
                    />
                  </TabsContent>
                )}

                {currentLesson.sources.length > 0 && (
                  <TabsContent value="sources">
                    <SourcesView sources={currentLesson.sources} />
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div 
            className="border-t px-8 py-4 flex items-center justify-between flex-shrink-0"
            style={{ 
              backgroundColor: 'var(--surface-0)',
              borderColor: 'var(--border-default)',
            }}
          >
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentLesson.status !== 'completed' && (
              <Button
                variant="outline"
                onClick={handleComplete}
                style={{
                  borderColor: 'var(--success)',
                  color: 'var(--success)',
                }}
              >
                Mark as Complete
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={!canGoNext}
              style={{
                backgroundColor: 'var(--accent-orange)',
                color: 'white',
              }}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
