package worker

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/StepanK17/course-constructor/internal/store"
)

type Processor struct {
	redis *redis.Client
	store *store.Store
}

type generationPayload struct {
	TaskID   string   `json:"task_id"`
	CourseID string   `json:"course_id"`
	UserID   string   `json:"user_id"`
	Topic    string   `json:"topic"`
	Goal     string   `json:"goal"`
	Level    string   `json:"level"`
	Sources  []string `json:"sources"`
}

func New(redisClient *redis.Client, store *store.Store) *Processor {
	return &Processor{redis: redisClient, store: store}
}

func (p *Processor) Run(ctx context.Context) {
	log.Println("worker started")
	for {
		select {
		case <-ctx.Done():
			return
		default:
			if err := p.processNext(ctx); err != nil {
				log.Printf("worker error: %v", err)
				time.Sleep(2 * time.Second)
			}
		}
	}
}

func (p *Processor) processNext(ctx context.Context) error {
	result, err := p.redis.BLPop(ctx, 0, "generation_queue").Result()
	if err != nil {
		return err
	}
	if len(result) < 2 {
		return nil
	}

	var payload generationPayload
	if err := json.Unmarshal([]byte(result[1]), &payload); err != nil {
		return err
	}

	return p.handleGeneration(ctx, payload)
}

func (p *Processor) handleGeneration(ctx context.Context, payload generationPayload) error {
	taskID, err := uuid.Parse(payload.TaskID)
	if err != nil {
		return err
	}
	courseID, err := uuid.Parse(payload.CourseID)
	if err != nil {
		return err
	}

	if err := p.store.UpdateGenerationStatus(ctx, taskID, "processing", nil); err != nil {
		return err
	}
	if err := p.store.UpdateCourseStatus(ctx, courseID, "processing", ""); err != nil {
		return err
	}

	content := buildDemoContent(payload.Topic, payload.Goal, payload.Level)
	if err := p.store.UpdateCourseContent(ctx, courseID, content); err != nil {
		return err
	}

	description := payload.Goal
	if description == "" {
		description = "Generated course"
	}

	if err := p.store.UpdateCourseStatus(ctx, courseID, "completed", description); err != nil {
		return err
	}
	return p.store.UpdateGenerationStatus(ctx, taskID, "completed", nil)
}

func buildDemoContent(topic, goal, level string) string {
	if topic == "" {
		topic = "Course"
	}
	lines := []string{
		"# " + topic,
		"",
		goal,
		"",
		"## Module 1: Overview",
		"Introduce the goals and structure for this course.",
		"",
		"## Module 2: Fundamentals",
		"Key concepts for " + topic + " (" + level + ").",
		"",
		"### Practice",
		"- Read the theory section",
		"- Build a small example",
		"- Write a short summary of what you learned",
		"",
		"## Module 3: Quick Check",
		"### Quiz",
		"- Q1: What is the main goal of this course?",
		"  - A. " + goal,
		"  - B. To finish quickly",
		"  - C. To skip practice",
		"  - Explanation: The course goal matches your input.",
		"",
		"### Sources",
		"- Course syllabus (https://example.com)",
	}
	return strings.Join(lines, "\n")
}
