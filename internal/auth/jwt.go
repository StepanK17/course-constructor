package auth

import (
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenPair struct {
	AccessToken  string
	RefreshToken string
	AccessExp    time.Time
	RefreshExp   time.Time
}

type Claims struct {
	TokenType string `json:"typ"`
	jwt.RegisteredClaims
}

func NewTokenPair(secret, issuer, userID string, accessTTL, refreshTTL time.Duration) (TokenPair, error) {
	accessExp := time.Now().Add(accessTTL)
	refreshExp := time.Now().Add(refreshTTL)

	access, err := signToken(secret, issuer, userID, "access", accessExp)
	if err != nil {
		return TokenPair{}, err
	}
	refresh, err := signToken(secret, issuer, userID, "refresh", refreshExp)
	if err != nil {
		return TokenPair{}, err
	}

	return TokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
		AccessExp:    accessExp,
		RefreshExp:   refreshExp,
	}, nil
}

func signToken(secret, issuer, userID, tokenType string, exp time.Time) (string, error) {
	claims := Claims{
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    issuer,
			Subject:   userID,
			ID:        uuid.NewString(),
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseToken(secret string, tokenString string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}
