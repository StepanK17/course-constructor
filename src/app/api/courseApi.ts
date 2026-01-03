import { apiRequest } from './client';

export type ApiCourse = {
  id: string;
  title?: string;
  topic: string;
  goal: string;
  level: string;
  description?: string | null;
  status: string;
  created_at: string;
};

export type ApiLessonSummary = {
  id: string;
  title: string;
  order_index: number;
  created_at: string;
};

export type ApiLessonDetail = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  content?: Record<string, unknown> | null;
  created_at: string;
};

export type ApiListResponse<T> = {
  items: T[];
  limit?: number;
  offset?: number;
};

export type ApiCourseProgress = {
  course_id: string;
  total: number;
  completed: number;
  percent: number;
};

export async function listCourses() {
  return apiRequest<ApiListResponse<ApiCourse>>('/api/v1/courses/');
}

export async function getCourse(courseID: string) {
  return apiRequest<ApiCourse>(`/api/v1/courses/${courseID}`);
}

export async function listLessons(courseID: string) {
  return apiRequest<ApiListResponse<ApiLessonSummary>>(`/api/v1/courses/${courseID}/lessons`);
}

export async function getLesson(lessonID: string) {
  return apiRequest<ApiLessonDetail>(`/api/v1/lessons/${lessonID}`);
}

export async function generateCourse(payload: {
  title?: string;
  topic: string;
  goal: string;
  level: string;
  source_document_ids?: string[];
  additional_context?: string;
  preferred_structure?: string;
}) {
  return apiRequest<{ course_id: string; task_id: string; status: string }>(
    '/api/v1/courses/generate',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function completeLesson(lessonID: string) {
  return apiRequest<{ status: string }>(`/api/v1/progress/lessons/${lessonID}`, {
    method: 'POST',
  });
}

export async function getCourseProgress(courseID: string) {
  return apiRequest<ApiCourseProgress>(`/api/v1/progress/courses/${courseID}`);
}

export async function deleteCourse(courseID: string) {
  return apiRequest<{ status: string }>(`/api/v1/courses/${courseID}`, {
    method: 'DELETE',
  });
}

export async function getCourseContent(courseID: string) {
  return apiRequest<{ status: string; content?: string }>(`/api/v1/courses/${courseID}/content`);
}
