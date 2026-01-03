import React from 'react';
import { CourseLibrary } from './screens/CourseLibrary';
import { CourseCreation, CourseConfig } from './screens/CourseCreation';
import { CourseTextView } from './screens/CourseTextView';
import { Course } from './data/mockData';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { deleteCourse, generateCourse, getCourseContent, listCourses } from './api/courseApi';

type Screen = 'library' | 'create' | 'course';

export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState<Screen>('library');
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = React.useState(true);
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);
  const [courseContent, setCourseContent] = React.useState('');
  const [courseContentStatus, setCourseContentStatus] = React.useState<'pending' | 'ready'>(
    'pending'
  );
  const [loadingCourseContent, setLoadingCourseContent] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const response = await listCourses();
        setCourses(response.items.map(mapCourse));
      } catch (error) {
        toast.error('Failed to load courses', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setLoadingCourses(false);
      }
    };
    load();
  }, []);

  React.useEffect(() => {
    if (!courses.length) return;

    const hasPending = courses.some((course) => course.status !== 'completed');
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const response = await listCourses();
        setCourses(response.items.map(mapCourse));
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [courses]);

  React.useEffect(() => {
    if (!selectedCourseId) return;
    if (courseContentStatus !== 'pending') return;

    const interval = setInterval(() => {
      loadCourseContent(selectedCourseId, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [courseContentStatus, selectedCourseId]);

  const currentCourse = courses.find((course) => course.id === selectedCourseId);

  const loadCourseContent = async (courseId: string, silent: boolean) => {
    setLoadingCourseContent(true);
    try {
      const response = await getCourseContent(courseId);
      if (response.status !== 'ready' || !response.content) {
        setCourseContentStatus('pending');
        if (!silent) {
          toast.info('Course is still generating', {
            description: 'Content will appear once generation is completed.',
          });
        }
        return;
      }
      setCourseContent(response.content);
      setCourseContentStatus('ready');
    } catch (error) {
      if (!silent) {
        toast.error('Failed to load course content', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } finally {
      setLoadingCourseContent(false);
    }
  };

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setCourseContent('');
    setCourseContentStatus('pending');
    setCurrentScreen('course');
    await loadCourseContent(courseId, false);
  };

  const handleCreateCourse = () => {
    setCurrentScreen('create');
  };

  const handleDeleteCourse = async (courseId: string) => {
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;
    const confirmed = window.confirm(`Delete course "${course.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteCourse(courseId);
      setCourses((prev) => prev.filter((item) => item.id !== courseId));
      if (selectedCourseId === courseId) {
        handleBackToLibrary();
      }
      toast.success('Course deleted');
    } catch (error) {
      toast.error('Failed to delete course', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleGenerateCourse = async (config: CourseConfig) => {
    try {
      await generateCourse({
        title: config.topic,
        topic: config.topic,
        goal: config.goal,
        level: config.level,
        additional_context: `Duration: ${config.duration} weeks. Minutes per day: ${config.minutesPerDay}. Language: ${config.language}.`,
        preferred_structure: config.sourceMode === 'internet' ? config.sourceTypes.join(', ') : 'documents',
        source_document_ids: config.sourceMode === 'documents' ? config.selectedDocuments : [],
      });

      toast.success('Course generation started', {
        description: 'The course will appear once generation is completed.',
      });
      const refreshed = await listCourses();
      setCourses(refreshed.items.map(mapCourse));
      setCurrentScreen('library');
    } catch (error) {
      toast.error('Failed to start generation', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleBackToLibrary = () => {
    setCurrentScreen('library');
    setSelectedCourseId(null);
    setCourseContent('');
    setCourseContentStatus('pending');
  };

  return (
    <>
      {currentScreen === 'library' && (
        <CourseLibrary
          courses={courses}
          loading={loadingCourses}
          onCourseSelect={handleCourseSelect}
          onCreateCourse={handleCreateCourse}
          onDeleteCourse={handleDeleteCourse}
        />
      )}

      {currentScreen === 'create' && (
        <CourseCreation onBack={handleBackToLibrary} onGenerate={handleGenerateCourse} />
      )}

      {currentScreen === 'course' && currentCourse && (
        <CourseTextView
          course={currentCourse}
          content={courseContent}
          loading={loadingCourseContent}
          status={courseContentStatus}
          onBack={handleBackToLibrary}
        />
      )}

      <Toaster />
    </>
  );
}

function mapCourse(course: {
  id: string;
  title?: string;
  topic: string;
  goal: string;
  level: string;
  description?: string | null;
  status: string;
  created_at: string;
}): Course {
  const status = mapCourseStatus(course.status);
  return {
    id: course.id,
    title: course.title || course.topic,
    description: course.description || course.goal,
    status,
    progress: status === 'completed' ? 100 : 0,
    difficulty: mapDifficulty(course.level),
    estimatedDuration: 0,
    language: 'en',
    createdAt: course.created_at,
    modules: [],
  };
}

function mapCourseStatus(status: string): Course['status'] {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'processing':
      return 'in-progress';
    default:
      return 'not-started';
  }
}

function mapDifficulty(value: string): Course['difficulty'] {
  if (value === 'intermediate' || value === 'advanced') return value;
  return 'beginner';
}
