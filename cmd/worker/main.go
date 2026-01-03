package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/redis/go-redis/v9"

	"github.com/StepanK17/course-constructor/internal/config"
	"github.com/StepanK17/course-constructor/internal/store"
	"github.com/StepanK17/course-constructor/internal/worker"
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

	processor := worker.New(redisClient, store.New(db))

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)

	go processor.Run(context.Background())

	<-shutdown
	log.Println("worker shutting down")
}
