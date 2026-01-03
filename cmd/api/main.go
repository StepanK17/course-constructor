package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/redis/go-redis/v9"

	"github.com/StepanK17/course-constructor/internal/config"
	httpapi "github.com/StepanK17/course-constructor/internal/http"
	"github.com/StepanK17/course-constructor/internal/queue"
	"github.com/StepanK17/course-constructor/internal/storage"
	"github.com/StepanK17/course-constructor/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	db, err := sql.Open("pgx", cfg.DBDSN)
	if err != nil {
		log.Fatalf("db error: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("db ping error: %v", err)
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Fatalf("redis error: %v", err)
	}

	s3Client, err := storage.NewS3Client(cfg.S3Endpoint, cfg.S3AccessKey, cfg.S3SecretKey, cfg.S3Region, cfg.S3Bucket, cfg.S3UseSSL)
	if err != nil {
		log.Fatalf("s3 error: %v", err)
	}
	if err := s3Client.EnsureBucket(ctx); err != nil {
		log.Fatalf("s3 bucket error: %v", err)
	}

	store := store.New(db)
	queue := queue.NewRedisQueue(redisClient)
	server := httpapi.NewServer(cfg, store, queue, s3Client)

	httpServer := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           server.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("api listening on :%s", cfg.Port)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)
	<-shutdown

	ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
}
