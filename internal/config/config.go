package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port           string
	DBDSN          string
	RedisAddr      string
	RedisPassword  string
	RedisDB        int
	S3Endpoint     string
	S3AccessKey    string
	S3SecretKey    string
	S3Region       string
	S3Bucket       string
	S3UseSSL       bool
	JWTSecret      string
	JWTIssuer      string
	AccessTTL      time.Duration
	RefreshTTL     time.Duration
	MaxFiles       int
	MaxTotalMB     int
	MaxFileMB      int
	AllowedOrigins []string
}

func Load() (Config, error) {
	cfg := Config{
		Port:       getEnv("APP_PORT", "8080"),
		DBDSN:      os.Getenv("DB_DSN"),
		RedisAddr:  getEnv("REDIS_ADDR", "localhost:6379"),
		RedisDB:    getEnvInt("REDIS_DB", 0),
		S3Endpoint: os.Getenv("S3_ENDPOINT"),
		S3Region:   getEnv("S3_REGION", "us-east-1"),
		S3Bucket:   getEnv("S3_BUCKET", "course-constructor"),
		S3UseSSL:   getEnvBool("S3_USE_SSL", false),
		JWTSecret:  os.Getenv("JWT_SECRET"),
		JWTIssuer:  getEnv("JWT_ISSUER", "course-constructor"),
		AccessTTL:  getEnvDuration("ACCESS_TOKEN_TTL", 15*time.Minute),
		RefreshTTL: getEnvDuration("REFRESH_TOKEN_TTL", 7*24*time.Hour),
		MaxFiles:   getEnvInt("MAX_FILES_PER_USER", 20),
		MaxTotalMB: getEnvInt("MAX_TOTAL_MB", 100),
		MaxFileMB:  getEnvInt("MAX_FILE_MB", 50),
	}

	cfg.RedisPassword = os.Getenv("REDIS_PASSWORD")
	cfg.S3AccessKey = os.Getenv("S3_ACCESS_KEY")
	cfg.S3SecretKey = os.Getenv("S3_SECRET_KEY")

	if origins := strings.TrimSpace(os.Getenv("CORS_ORIGINS")); origins != "" {
		cfg.AllowedOrigins = splitAndTrim(origins)
	}

	if cfg.DBDSN == "" {
		return cfg, fmt.Errorf("DB_DSN is required")
	}
	if cfg.JWTSecret == "" {
		return cfg, fmt.Errorf("JWT_SECRET is required")
	}
	if cfg.S3Endpoint == "" || cfg.S3AccessKey == "" || cfg.S3SecretKey == "" {
		return cfg, fmt.Errorf("S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY are required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.Atoi(value)
		if err == nil {
			return parsed
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.ParseBool(value)
		if err == nil {
			return parsed
		}
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		parsed, err := time.ParseDuration(value)
		if err == nil {
			return parsed
		}
	}
	return fallback
}

func splitAndTrim(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
