package queue

import (
	"context"
	"encoding/json"

	"github.com/redis/go-redis/v9"
)

type RedisQueue struct {
	client          *redis.Client
	generationQueue string
	documentQueue   string
}

type GenerationPayload struct {
	TaskID   string   `json:"task_id"`
	CourseID string   `json:"course_id"`
	UserID   string   `json:"user_id"`
	Topic    string   `json:"topic"`
	Goal     string   `json:"goal"`
	Level    string   `json:"level"`
	Sources  []string `json:"sources"`
}

type DocumentPayload struct {
	DocumentID string `json:"document_id"`
	UserID     string `json:"user_id"`
	StorageKey string `json:"storage_key"`
}

func NewRedisQueue(client *redis.Client) *RedisQueue {
	return &RedisQueue{
		client:          client,
		generationQueue: "generation_queue",
		documentQueue:   "document_queue",
	}
}

func (q *RedisQueue) EnqueueGeneration(ctx context.Context, payload GenerationPayload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return q.client.RPush(ctx, q.generationQueue, data).Err()
}

func (q *RedisQueue) EnqueueDocument(ctx context.Context, payload DocumentPayload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return q.client.RPush(ctx, q.documentQueue, data).Err()
}
