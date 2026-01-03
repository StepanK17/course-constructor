package httpapi

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/StepanK17/course-constructor/internal/auth"
	"github.com/StepanK17/course-constructor/internal/config"
	"github.com/StepanK17/course-constructor/internal/queue"
	"github.com/StepanK17/course-constructor/internal/storage"
	"github.com/StepanK17/course-constructor/internal/store"
)

type Server struct {
	cfg   config.Config
	store *store.Store
	queue *queue.RedisQueue
	s3    *storage.S3Client
}

func NewServer(cfg config.Config, store *store.Store, queue *queue.RedisQueue, s3 *storage.S3Client) *Server {
	return &Server{cfg: cfg, store: store, queue: queue, s3: s3}
}

func (s *Server) Routes() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)

	corsOptions := cors.Options{
		AllowedOrigins:   s.cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}
	if len(corsOptions.AllowedOrigins) == 0 {
		corsOptions.AllowedOrigins = []string{"*"}
		corsOptions.AllowCredentials = false
	}
	r.Use(cors.Handler(corsOptions))

	r.Get("/api/v1/health", s.handleHealth())

	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Post("/register", s.handleRegister())
		r.Post("/login", s.handleLogin())
		r.Post("/refresh", s.handleRefresh())
		r.Post("/logout", s.handleLogout())
	})

	r.Group(func(r chi.Router) {
		r.Use(s.authMiddleware())

		r.Route("/api/v1/documents", func(r chi.Router) {
			r.Post("/", s.handleUploadDocument())
			r.Get("/", s.handleListDocuments())
			r.Get("/{documentID}", s.handleGetDocument())
			r.Delete("/{documentID}", s.handleDeleteDocument())
		})

		r.Route("/api/v1/courses", func(r chi.Router) {
			r.Post("/generate", s.handleGenerateCourse())
			r.Get("/", s.handleListCourses())
			r.Get("/{courseID}", s.handleGetCourse())
			r.Get("/{courseID}/content", s.handleCourseContent())
			r.Delete("/{courseID}", s.handleDeleteCourse())
			r.Get("/{courseID}/status", s.handleCourseStatus())
			r.Get("/{courseID}/lessons", s.handleListLessons())
		})

		r.Route("/api/v1/lessons", func(r chi.Router) {
			r.Get("/{lessonID}", s.handleGetLesson())
		})

		r.Route("/api/v1/progress", func(r chi.Router) {
			r.Post("/lessons/{lessonID}", s.handleCompleteLesson())
			r.Get("/courses/{courseID}", s.handleCourseProgress())
		})
	})

	return r
}

func (s *Server) handleHealth() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

func (s *Server) tokenPairResponse(pair auth.TokenPair) map[string]interface{} {
	return map[string]interface{}{
		"access_token":  pair.AccessToken,
		"refresh_token": pair.RefreshToken,
		"access_exp":    pair.AccessExp.Format(time.RFC3339),
		"refresh_exp":   pair.RefreshExp.Format(time.RFC3339),
	}
}
