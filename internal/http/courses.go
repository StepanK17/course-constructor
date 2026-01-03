package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/StepanK17/course-constructor/internal/queue"
	"github.com/StepanK17/course-constructor/internal/store"
)

type generateCourseRequest struct {
	Title              string   `json:"title"`
	Topic              string   `json:"topic"`
	Goal               string   `json:"goal"`
	Level              string   `json:"level"`
	SourceDocumentIDs  []string `json:"source_document_ids"`
	AdditionalContext  string   `json:"additional_context"`
	PreferredStructure string   `json:"preferred_structure"`
}

func (s *Server) handleGenerateCourse() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := userIDFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var req generateCourseRequest
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.Topic == "" || req.Goal == "" || req.Level == "" {
			writeError(w, http.StatusBadRequest, "topic, goal, and level are required")
			return
		}

		course := store.Course{
			UserID: userID,
			Title:  nullString(req.Title),
			Topic:  req.Topic,
			Goal:   req.Goal,
			Level:  req.Level,
			Status: "pending",
		}
		courseID, err := s.store.CreateCourse(r.Context(), course)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create course")
			return
		}

		payload := map[string]interface{}{
			"topic":               req.Topic,
			"goal":                req.Goal,
			"level":               req.Level,
			"title":               req.Title,
			"source_document_ids": req.SourceDocumentIDs,
			"additional_context":  req.AdditionalContext,
			"preferred_structure": req.PreferredStructure,
		}
		payloadJSON, err := json.Marshal(payload)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to encode payload")
			return
		}

		task := store.GenerationTask{
			UserID:   userID,
			CourseID: courseID,
			Status:   "pending",
			Payload:  payloadJSON,
		}
		taskID, err := s.store.CreateGenerationTask(r.Context(), task)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create generation task")
			return
		}

		_ = s.queue.EnqueueGeneration(r.Context(), queue.GenerationPayload{
			TaskID:   taskID.String(),
			CourseID: courseID.String(),
			UserID:   userID.String(),
			Topic:    req.Topic,
			Goal:     req.Goal,
			Level:    req.Level,
			Sources:  req.SourceDocumentIDs,
		})

		writeJSON(w, http.StatusAccepted, map[string]interface{}{
			"course_id": courseID,
			"task_id":   taskID,
			"status":    "pending",
		})
	}
}

func (s *Server) handleListCourses() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := userIDFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		limit, offset := parsePagination(r)
		status := r.URL.Query().Get("status")
		courses, err := s.store.ListCourses(r.Context(), userID, status, limit, offset)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list courses")
			return
		}

		items := make([]map[string]interface{}, 0, len(courses))
		for _, course := range courses {
			items = append(items, map[string]interface{}{
				"id":          course.ID,
				"title":       course.Title.String,
				"topic":       course.Topic,
				"goal":        course.Goal,
				"level":       course.Level,
				"status":      course.Status,
				"description": course.Description.String,
				"created_at":  course.CreatedAt,
			})
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"items":  items,
			"limit":  limit,
			"offset": offset,
		})
	}
}

func (s *Server) handleGetCourse() http.HandlerFunc {
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

		course, err := s.store.GetCourseByID(r.Context(), userID, courseID)
		if err != nil {
			if store.IsNotFound(err) {
				writeError(w, http.StatusNotFound, "course not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to get course")
			return
		}

		lessons, err := s.store.ListLessonsByCourse(r.Context(), userID, courseID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to get lessons")
			return
		}

		lessonItems := make([]map[string]interface{}, 0, len(lessons))
		for _, lesson := range lessons {
			lessonItems = append(lessonItems, map[string]interface{}{
				"id":          lesson.ID,
				"title":       lesson.Title,
				"order_index": lesson.OrderIndex,
				"created_at":  lesson.CreatedAt,
			})
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"id":          course.ID,
			"title":       course.Title.String,
			"topic":       course.Topic,
			"goal":        course.Goal,
			"level":       course.Level,
			"status":      course.Status,
			"description": course.Description.String,
			"created_at":  course.CreatedAt,
			"lessons":     lessonItems,
		})
	}
}

func (s *Server) handleCourseStatus() http.HandlerFunc {
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

		course, err := s.store.GetCourseByID(r.Context(), userID, courseID)
		if err != nil {
			if store.IsNotFound(err) {
				writeError(w, http.StatusNotFound, "course not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to get course")
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"id":     course.ID,
			"status": course.Status,
		})
	}
}

func (s *Server) handleCourseContent() http.HandlerFunc {
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

		content, status, err := s.store.GetCourseContent(r.Context(), userID, courseID)
		if err != nil {
			if store.IsNotFound(err) {
				writeError(w, http.StatusNotFound, "course not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to get course content")
			return
		}

		if content == "" || status != "completed" {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"status": "pending",
			})
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"status":  "ready",
			"content": content,
		})
	}
}

func (s *Server) handleDeleteCourse() http.HandlerFunc {
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

		if err := s.store.DeleteCourse(r.Context(), userID, courseID); err != nil {
			if store.IsNotFound(err) {
				writeError(w, http.StatusNotFound, "course not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to delete course")
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	}
}
