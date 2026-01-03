package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type S3Client struct {
	client *minio.Client
	bucket string
	region string
}

func NewS3Client(endpoint, accessKey, secretKey, region, bucket string, useSSL bool) (*S3Client, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		Region: region,
	})
	if err != nil {
		return nil, err
	}

	return &S3Client{client: client, bucket: bucket, region: region}, nil
}

func (s *S3Client) EnsureBucket(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	return s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{Region: s.region})
}

func (s *S3Client) PutObject(ctx context.Context, key string, reader io.Reader, size int64, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucket, key, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	return err
}

func (s *S3Client) RemoveObject(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}

func (s *S3Client) ObjectURL(key string) string {
	scheme := "http"
	if s.client.EndpointURL().Scheme == "https" {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s/%s/%s", scheme, s.client.EndpointURL().Host, s.bucket, key)
}
