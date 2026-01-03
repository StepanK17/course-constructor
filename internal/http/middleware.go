package httpapi

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/StepanK17/course-constructor/internal/auth"
)

type contextKey string

const userIDKey contextKey = "user_id"

func (s *Server) authMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				writeError(w, http.StatusUnauthorized, "missing authorization header")
				return
			}
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				writeError(w, http.StatusUnauthorized, "invalid authorization header")
				return
			}

			claims, err := auth.ParseToken(s.cfg.JWTSecret, parts[1])
			if err != nil {
				writeError(w, http.StatusUnauthorized, "invalid token")
				return
			}
			if claims.TokenType != "access" {
				writeError(w, http.StatusUnauthorized, "invalid token type")
				return
			}

			userID, err := uuid.Parse(claims.Subject)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "invalid token subject")
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func userIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	value := ctx.Value(userIDKey)
	if value == nil {
		return uuid.Nil, false
	}
	id, ok := value.(uuid.UUID)
	return id, ok
}
