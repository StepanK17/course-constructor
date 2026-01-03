package httpapi

import (
	"net/http"

	"github.com/StepanK17/course-constructor/internal/store"
)

func (s *Server) handleCompleteLesson() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := userIDFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		lessonID, err := parseUUIDParam(r, "lessonID")
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid lesson id")
			return
		}

		if err := s.store.MarkLessonComplete(r.Context(), userID, lessonID); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update progress")
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"status": "completed"})
	}
}

func (s *Server) handleCourseProgress() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := userIDFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		courseID, err := parseUUIDParam(r, "courseID")
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid course id")
			return
		}

		if _, err := s.store.GetCourseByID(r.Context(), userID, courseID); err != nil {
			if store.IsNotFound(err) {
				writeError(w, http.StatusNotFound, "course not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to get course")
			return
		}

		total, completed, err := s.store.GetCourseProgress(r.Context(), userID, courseID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to get progress")
			return
		}

		percentage := 0
		if total > 0 {
			percentage = int(float64(completed) / float64(total) * 100)
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"course_id": courseID,
			"total":     total,
			"completed": completed,
			"percent":   percentage,
		})
	}
}
