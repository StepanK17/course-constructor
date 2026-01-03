package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Store struct {
	DB *sql.DB
}

func New(db *sql.DB) *Store {
	return &Store{DB: db}
}

type User struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
	Name         sql.NullString
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type RefreshToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Hash      string
	ExpiresAt time.Time
	RevokedAt sql.NullTime
}

type Document struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Filename    string
	ContentType string
	SizeBytes   int64
	StorageKey  string
	Status      string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type Course struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Title       sql.NullString
	Topic       string
	Goal        string
	Level       string
	Description sql.NullString
	ContentText sql.NullString
	Status      string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type Lesson struct {
	ID         uuid.UUID
	CourseID   uuid.UUID
	Title      string
	OrderIndex int
	Content    []byte
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type LessonInput struct {
	Title      string
	OrderIndex int
	Content    map[string]interface{}
}

type GenerationTask struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	CourseID  uuid.UUID
	Status    string
	Payload   []byte
	QueuedAt  time.Time
	StartedAt sql.NullTime
	DoneAt    sql.NullTime
	Error     sql.NullString
}

func (s *Store) CreateUser(ctx context.Context, email, passwordHash, name string) (uuid.UUID, error) {
	var id uuid.UUID
	nameValue := sql.NullString{String: name, Valid: name != ""}
	query := `INSERT INTO users (email, password_hash, name)
		VALUES ($1, $2, $3)
		RETURNING id`
	if err := s.DB.QueryRowContext(ctx, query, email, passwordHash, nameValue).Scan(&id); err != nil {
		return uuid.Nil, err
	}
	return id, nil
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (User, error) {
	var user User
	query := `SELECT id, email, password_hash, name, created_at, updated_at
		FROM users
		WHERE email = $1`
	err := s.DB.QueryRowContext(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt, &user.UpdatedAt,
	)
	return user, err
}

func (s *Store) GetUserByID(ctx context.Context, id uuid.UUID) (User, error) {
	var user User
	query := `SELECT id, email, password_hash, name, created_at, updated_at
		FROM users
		WHERE id = $1`
	err := s.DB.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt, &user.UpdatedAt,
	)
	return user, err
}

func (s *Store) StoreRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	query := `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)`
	_, err := s.DB.ExecContext(ctx, query, userID, tokenHash, expiresAt)
	return err
}

func (s *Store) GetRefreshToken(ctx context.Context, tokenHash string) (RefreshToken, error) {
	var token RefreshToken
	query := `SELECT id, user_id, token_hash, expires_at, revoked_at
		FROM refresh_tokens
		WHERE token_hash = $1`
	err := s.DB.QueryRowContext(ctx, query, tokenHash).Scan(
		&token.ID, &token.UserID, &token.Hash, &token.ExpiresAt, &token.RevokedAt,
	)
	return token, err
}

func (s *Store) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	query := `UPDATE refresh_tokens
		SET revoked_at = now()
		WHERE token_hash = $1 AND revoked_at IS NULL`
	_, err := s.DB.ExecContext(ctx, query, tokenHash)
	return err
}

func (s *Store) CreateDocument(ctx context.Context, doc Document) (uuid.UUID, error) {
	var id uuid.UUID
	query := `INSERT INTO documents (user_id, filename, content_type, size_bytes, storage_key, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`
	err := s.DB.QueryRowContext(ctx, query, doc.UserID, doc.Filename, doc.ContentType, doc.SizeBytes, doc.StorageKey, doc.Status).Scan(&id)
	return id, err
}

func (s *Store) ListDocuments(ctx context.Context, userID uuid.UUID, limit, offset int) ([]Document, error) {
	query := `SELECT id, user_id, filename, content_type, size_bytes, storage_key, status, created_at, updated_at
		FROM documents
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`
	rows, err := s.DB.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []Document
	for rows.Next() {
		var doc Document
		if err := rows.Scan(&doc.ID, &doc.UserID, &doc.Filename, &doc.ContentType, &doc.SizeBytes, &doc.StorageKey, &doc.Status, &doc.CreatedAt, &doc.UpdatedAt); err != nil {
			return nil, err
		}
		docs = append(docs, doc)
	}
	return docs, rows.Err()
}

func (s *Store) GetDocumentByID(ctx context.Context, userID, docID uuid.UUID) (Document, error) {
	var doc Document
	query := `SELECT id, user_id, filename, content_type, size_bytes, storage_key, status, created_at, updated_at
		FROM documents
		WHERE id = $1 AND user_id = $2`
	err := s.DB.QueryRowContext(ctx, query, docID, userID).Scan(
		&doc.ID, &doc.UserID, &doc.Filename, &doc.ContentType, &doc.SizeBytes, &doc.StorageKey, &doc.Status, &doc.CreatedAt, &doc.UpdatedAt,
	)
	return doc, err
}

func (s *Store) DeleteDocument(ctx context.Context, userID, docID uuid.UUID) error {
	query := `DELETE FROM documents WHERE id = $1 AND user_id = $2`
	res, err := s.DB.ExecContext(ctx, query, docID, userID)
	if err != nil {
		return err
	}
	count, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *Store) GetDocumentUsage(ctx context.Context, userID uuid.UUID) (int, int64, error) {
	query := `SELECT COUNT(*), COALESCE(SUM(size_bytes), 0)
		FROM documents
		WHERE user_id = $1`
	var count int
	var size int64
	if err := s.DB.QueryRowContext(ctx, query, userID).Scan(&count, &size); err != nil {
		return 0, 0, err
	}
	return count, size, nil
}

func (s *Store) CreateCourse(ctx context.Context, course Course) (uuid.UUID, error) {
	var id uuid.UUID
	query := `INSERT INTO courses (user_id, title, topic, goal, level, description, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`
	err := s.DB.QueryRowContext(ctx, query, course.UserID, course.Title, course.Topic, course.Goal, course.Level, course.Description, course.Status).Scan(&id)
	return id, err
}

func (s *Store) ListCourses(ctx context.Context, userID uuid.UUID, status string, limit, offset int) ([]Course, error) {
	query := `SELECT id, user_id, title, topic, goal, level, description, status, created_at, updated_at
		FROM courses
		WHERE user_id = $1`
	args := []interface{}{userID}
	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC LIMIT $" + itoa(len(args)+1) + " OFFSET $" + itoa(len(args)+2)
	args = append(args, limit, offset)

	rows, err := s.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []Course
	for rows.Next() {
		var course Course
		if err := rows.Scan(&course.ID, &course.UserID, &course.Title, &course.Topic, &course.Goal, &course.Level, &course.Description, &course.Status, &course.CreatedAt, &course.UpdatedAt); err != nil {
			return nil, err
		}
		courses = append(courses, course)
	}
	return courses, rows.Err()
}

func (s *Store) GetCourseByID(ctx context.Context, userID, courseID uuid.UUID) (Course, error) {
	var course Course
	query := `SELECT id, user_id, title, topic, goal, level, description, content_text, status, created_at, updated_at
		FROM courses
		WHERE id = $1 AND user_id = $2`
	err := s.DB.QueryRowContext(ctx, query, courseID, userID).Scan(
		&course.ID, &course.UserID, &course.Title, &course.Topic, &course.Goal, &course.Level, &course.Description, &course.ContentText, &course.Status, &course.CreatedAt, &course.UpdatedAt,
	)
	return course, err
}

func (s *Store) DeleteCourse(ctx context.Context, userID, courseID uuid.UUID) error {
	query := `DELETE FROM courses WHERE id = $1 AND user_id = $2`
	res, err := s.DB.ExecContext(ctx, query, courseID, userID)
	if err != nil {
		return err
	}
	count, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *Store) CreateGenerationTask(ctx context.Context, task GenerationTask) (uuid.UUID, error) {
	var id uuid.UUID
	query := `INSERT INTO generation_tasks (user_id, course_id, status, payload)
		VALUES ($1, $2, $3, $4)
		RETURNING id`
	err := s.DB.QueryRowContext(ctx, query, task.UserID, task.CourseID, task.Status, task.Payload).Scan(&id)
	return id, err
}

func (s *Store) UpdateCourseStatus(ctx context.Context, courseID uuid.UUID, status string, description string) error {
	query := `UPDATE courses
		SET status = $2,
			description = COALESCE(NULLIF($3, ''), description),
			updated_at = now()
		WHERE id = $1`
	_, err := s.DB.ExecContext(ctx, query, courseID, status, description)
	return err
}

func (s *Store) UpdateCourseContent(ctx context.Context, courseID uuid.UUID, content string) error {
	query := `UPDATE courses
		SET content_text = $2,
			updated_at = now()
		WHERE id = $1`
	_, err := s.DB.ExecContext(ctx, query, courseID, content)
	return err
}

func (s *Store) GetCourseContent(ctx context.Context, userID, courseID uuid.UUID) (string, string, error) {
	query := `SELECT content_text, status
		FROM courses
		WHERE id = $1 AND user_id = $2`
	var content sql.NullString
	var status string
	if err := s.DB.QueryRowContext(ctx, query, courseID, userID).Scan(&content, &status); err != nil {
		return "", "", err
	}
	if !content.Valid {
		return "", status, nil
	}
	return content.String, status, nil
}

func (s *Store) UpdateGenerationStatus(ctx context.Context, taskID uuid.UUID, status string, errMsg *string) error {
	query := `UPDATE generation_tasks
		SET status = $2,
			started_at = CASE WHEN $2 = 'processing' THEN now() ELSE started_at END,
			completed_at = CASE WHEN $2 = 'completed' THEN now() ELSE completed_at END,
			error_message = $3
		WHERE id = $1`
	_, err := s.DB.ExecContext(ctx, query, taskID, status, errMsg)
	return err
}

func (s *Store) ReplaceLessons(ctx context.Context, courseID uuid.UUID, lessons []LessonInput) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM lessons WHERE course_id = $1`, courseID); err != nil {
		return err
	}

	for _, lesson := range lessons {
		content, err := json.Marshal(lesson.Content)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO lessons (course_id, title, order_index, content)
			VALUES ($1, $2, $3, $4)`, courseID, lesson.Title, lesson.OrderIndex, content)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *Store) ListLessonsByCourse(ctx context.Context, userID, courseID uuid.UUID) ([]Lesson, error) {
	query := `SELECT l.id, l.course_id, l.title, l.order_index, l.content, l.created_at, l.updated_at
		FROM lessons l
		JOIN courses c ON c.id = l.course_id
		WHERE c.id = $1 AND c.user_id = $2
		ORDER BY l.order_index ASC`
	rows, err := s.DB.QueryContext(ctx, query, courseID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []Lesson
	for rows.Next() {
		var lesson Lesson
		if err := rows.Scan(&lesson.ID, &lesson.CourseID, &lesson.Title, &lesson.OrderIndex, &lesson.Content, &lesson.CreatedAt, &lesson.UpdatedAt); err != nil {
			return nil, err
		}
		lessons = append(lessons, lesson)
	}
	return lessons, rows.Err()
}

func (s *Store) GetLessonByID(ctx context.Context, userID, lessonID uuid.UUID) (Lesson, error) {
	var lesson Lesson
	query := `SELECT l.id, l.course_id, l.title, l.order_index, l.content, l.created_at, l.updated_at
		FROM lessons l
		JOIN courses c ON c.id = l.course_id
		WHERE l.id = $1 AND c.user_id = $2`
	err := s.DB.QueryRowContext(ctx, query, lessonID, userID).Scan(
		&lesson.ID, &lesson.CourseID, &lesson.Title, &lesson.OrderIndex, &lesson.Content, &lesson.CreatedAt, &lesson.UpdatedAt,
	)
	return lesson, err
}

func (s *Store) MarkLessonComplete(ctx context.Context, userID, lessonID uuid.UUID) error {
	query := `INSERT INTO user_progress (user_id, lesson_id, completed_at)
		VALUES ($1, $2, now())
		ON CONFLICT (user_id, lesson_id)
		DO UPDATE SET completed_at = EXCLUDED.completed_at`
	_, err := s.DB.ExecContext(ctx, query, userID, lessonID)
	return err
}

func (s *Store) GetCourseProgress(ctx context.Context, userID, courseID uuid.UUID) (int, int, error) {
	query := `SELECT
		(SELECT COUNT(*) FROM lessons WHERE course_id = $1) AS total,
		(SELECT COUNT(*) FROM user_progress up
			JOIN lessons l ON l.id = up.lesson_id
			JOIN courses c ON c.id = l.course_id
			WHERE c.id = $1 AND c.user_id = $2 AND up.user_id = $2) AS completed`
	var total, completed int
	if err := s.DB.QueryRowContext(ctx, query, courseID, userID).Scan(&total, &completed); err != nil {
		return 0, 0, err
	}
	return total, completed, nil
}

func IsNotFound(err error) bool {
	return errors.Is(err, sql.ErrNoRows)
}

func itoa(value int) string {
	return fmt.Sprintf("%d", value)
}
