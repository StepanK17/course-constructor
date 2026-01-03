package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/StepanK17/course-constructor/internal/store"
)

func (s *Server) handleListLessons() http.HandlerFunc {
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

		lessons, err := s.store.ListLessonsByCourse(r.Context(), userID, courseID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list lessons")
			return
		}

		items := make([]map[string]interface{}, 0, len(lessons))
		for _, lesson := range lessons {
			items = append(items, map[string]interface{}{
				"id":          lesson.ID,
				"title":       lesson.Title,
				"order_index": lesson.OrderIndex,
				"created_at":  lesson.CreatedAt,
			})
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{"items": items})
	}
}

func (s *Server) handleGetLesson() http.HandlerFunc {
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

		lesson, err := s.store.GetLessonByID(r.Context(), userID, lessonID)
		if err != nil {
			if store.IsNotFound(err) {
				writeError(w, http.StatusNotFound, "lesson not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to get lesson")
			return
		}

		var content interface{}
		if len(lesson.Content) > 0 {
			_ = json.Unmarshal(lesson.Content, &content)
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"id":          lesson.ID,
			"course_id":   lesson.CourseID,
			"title":       lesson.Title,
			"order_index": lesson.OrderIndex,
			"content":     content,
			"created_at":  lesson.CreatedAt,
		})
	}
}
