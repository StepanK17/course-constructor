package httpapi

import (
	"fmt"
	"mime"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/google/uuid"

	"github.com/StepanK17/course-constructor/internal/queue"
	"github.com/StepanK17/course-constructor/internal/store"
)

var allowedExtensions = map[string]struct{}{
	".pdf":  {},
	".docx": {},
	".txt":  {},
	".md":   {},
}

func (s *Server) handleUploadDocument() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := userIDFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		count, totalSize, err := s.store.GetDocumentUsage(r.Context(), userID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to check document limits")
			return
		}
		if count >= s.cfg.MaxFiles {
			writeError(w, http.StatusBadRequest, "document limit exceeded")
			return
		}

		if err := r.ParseMultipartForm(int64(s.cfg.MaxFileMB) * 1024 * 1024); err != nil {
			writeError(w, http.StatusBadRequest, "invalid multipart form")
			return
		}

		file, header, err := r.FormFile("file")
		if err != nil {
			writeError(w, http.StatusBadRequest, "file is required")
			return
		}
		defer file.Close()

		ext := strings.ToLower(filepath.Ext(header.Filename))
		if _, allowed := allowedExtensions[ext]; !allowed {
			writeError(w, http.StatusBadRequest, "unsupported file type")
			return
		}

		if header.Size > int64(s.cfg.MaxFileMB)*1024*1024 {
			writeError(w, http.StatusBadRequest, "file exceeds size limit")
			return
		}
		if totalSize+header.Size > int64(s.cfg.MaxTotalMB)*1024*1024 {
			writeError(w, http.StatusBadRequest, "total storage limit exceeded")
			return
		}

		docID := uuid.New()
		filename := filepath.Base(header.Filename)
		storageKey := fmt.Sprintf("%s/%s/%s", userID.String(), docID.String(), filename)

		contentType := header.Header.Get("Content-Type")
		if contentType == "" {
			contentType = mime.TypeByExtension(ext)
		}

		if err := s.s3.PutObject(r.Context(), storageKey, file, header.Size, contentType); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to store document")
			return
		}

		doc := store.Document{
			ID:          docID,
			UserID:      userID,
			Filename:    filename,
			ContentType: contentType,
			SizeBytes:   header.Size,
			StorageKey:  storageKey,
			Status:      "pending",
		}

		storedID, err := s.store.CreateDocument(r.Context(), doc)
		if err != nil {
			_ = s.s3.RemoveObject(r.Context(), storageKey)
			writeError(w, http.StatusInternalServerError, "failed to save document")
			return
		}

		_ = s.queue.EnqueueDocument(r.Context(), queue.DocumentPayload{
			DocumentID: storedID.String(),
			UserID:     userID.String(),
			StorageKey: storageKey,
		})

		writeJSON(w, http.StatusCreated, map[string]interface{}{
			"id":           storedID,
			"filename":     filename,
			"content_type": contentType,
			"size_bytes":   header.Size,
			"status":       "pending",
		})
	}
}

func (s *Server) handleListDocuments() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := userIDFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		limit, offset := parsePagination(r)
		docs, err := s.store.ListDocuments(r.Context(), userID, limit, offset)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list documents")
			return
		}

		response := make([]map[string]interface{}, 0, len(docs))
		for _, doc := range docs {
			response = append(response, map[string]interface{}{
				"id":           doc.ID,
				"filename":     doc.Filename,
				"content_type": doc.ContentType,
				"size_bytes":   doc.SizeBytes,
				"status":       doc.Status,
				"created_at":   doc.CreatedAt,
			})
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"items":  response,
			"limit":  limit,
			"offset": offset,
		})
	}
}

func (s *Server) handleGetDocument() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := userIDFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		docID, err := parseUUIDParam(r, "documentID")
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid document id")
			return
		}

		doc, err := s.store.GetDocumentByID(r.Context(), userID, docID)
		if err != nil {
			if store.IsNotFound(err) {
				writeError(w, http.StatusNotFound, "document not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to get document")
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"id":           doc.ID,
			"filename":     doc.Filename,
			"content_type": doc.ContentType,
			"size_bytes":   doc.SizeBytes,
			"status":       doc.Status,
			"created_at":   doc.CreatedAt,
			"storage_key":  doc.StorageKey,
		})
	}
}

func (s *Server) handleDeleteDocument() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := userIDFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		docID, err := parseUUIDParam(r, "documentID")
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid document id")
			return
		}

		doc, err := s.store.GetDocumentByID(r.Context(), userID, docID)
		if err != nil {
			if store.IsNotFound(err) {
				writeError(w, http.StatusNotFound, "document not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to get document")
			return
		}

		if err := s.store.DeleteDocument(r.Context(), userID, docID); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to delete document")
			return
		}

		_ = s.s3.RemoveObject(r.Context(), doc.StorageKey)
		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	}
}
