package httpapi

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func parsePagination(r *http.Request) (int, int) {
	query := r.URL.Query()
	limit := 20
	if value := query.Get("limit"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > 100 {
		limit = 100
	}

	offset := 0
	if value := query.Get("offset"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	return limit, offset
}

func parseUUIDParam(r *http.Request, key string) (uuid.UUID, error) {
	value := chi.URLParam(r, key)
	return uuid.Parse(value)
}

func nullString(value string) sql.NullString {
	return sql.NullString{String: value, Valid: value != ""}
}
