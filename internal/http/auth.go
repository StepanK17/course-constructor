package httpapi

import (
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgconn"
	"golang.org/x/crypto/bcrypt"

	"github.com/StepanK17/course-constructor/internal/auth"
)

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (s *Server) handleRegister() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req registerRequest
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.Email == "" || req.Password == "" {
			writeError(w, http.StatusBadRequest, "email and password are required")
			return
		}

		passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to hash password")
			return
		}

		userID, err := s.store.CreateUser(r.Context(), req.Email, string(passwordHash), req.Name)
		if err != nil {
			if isUniqueViolation(err) {
				writeError(w, http.StatusConflict, "email already registered")
				return
			}
			writeError(w, http.StatusInternalServerError, "failed to create user")
			return
		}

		pair, err := auth.NewTokenPair(s.cfg.JWTSecret, s.cfg.JWTIssuer, userID.String(), s.cfg.AccessTTL, s.cfg.RefreshTTL)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to generate tokens")
			return
		}

		if err := s.store.StoreRefreshToken(r.Context(), userID, auth.HashToken(pair.RefreshToken), pair.RefreshExp); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to store refresh token")
			return
		}

		writeJSON(w, http.StatusCreated, s.tokenPairResponse(pair))
	}
}

func (s *Server) handleLogin() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req loginRequest
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		user, err := s.store.GetUserByEmail(r.Context(), req.Email)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			writeError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}

		pair, err := auth.NewTokenPair(s.cfg.JWTSecret, s.cfg.JWTIssuer, user.ID.String(), s.cfg.AccessTTL, s.cfg.RefreshTTL)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to generate tokens")
			return
		}

		if err := s.store.StoreRefreshToken(r.Context(), user.ID, auth.HashToken(pair.RefreshToken), pair.RefreshExp); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to store refresh token")
			return
		}

		writeJSON(w, http.StatusOK, s.tokenPairResponse(pair))
	}
}

func (s *Server) handleRefresh() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req refreshRequest
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.RefreshToken == "" {
			writeError(w, http.StatusBadRequest, "refresh token is required")
			return
		}

		claims, err := auth.ParseToken(s.cfg.JWTSecret, req.RefreshToken)
		if err != nil || claims.TokenType != "refresh" {
			writeError(w, http.StatusUnauthorized, "invalid refresh token")
			return
		}

		stored, err := s.store.GetRefreshToken(r.Context(), auth.HashToken(req.RefreshToken))
		if err != nil {
			writeError(w, http.StatusUnauthorized, "refresh token not found")
			return
		}
		if stored.RevokedAt.Valid {
			writeError(w, http.StatusUnauthorized, "refresh token revoked")
			return
		}
		if stored.ExpiresAt.Before(time.Now()) {
			_ = s.store.RevokeRefreshToken(r.Context(), auth.HashToken(req.RefreshToken))
			writeError(w, http.StatusUnauthorized, "refresh token expired")
			return
		}

		pair, err := auth.NewTokenPair(s.cfg.JWTSecret, s.cfg.JWTIssuer, stored.UserID.String(), s.cfg.AccessTTL, s.cfg.RefreshTTL)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to generate tokens")
			return
		}

		if err := s.store.RevokeRefreshToken(r.Context(), auth.HashToken(req.RefreshToken)); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to rotate refresh token")
			return
		}
		if err := s.store.StoreRefreshToken(r.Context(), stored.UserID, auth.HashToken(pair.RefreshToken), pair.RefreshExp); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to store refresh token")
			return
		}

		writeJSON(w, http.StatusOK, s.tokenPairResponse(pair))
	}
}

func (s *Server) handleLogout() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req refreshRequest
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.RefreshToken == "" {
			writeError(w, http.StatusBadRequest, "refresh token is required")
			return
		}

		if err := s.store.RevokeRefreshToken(r.Context(), auth.HashToken(req.RefreshToken)); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to revoke refresh token")
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
	}
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}
