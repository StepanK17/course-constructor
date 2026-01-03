FROM golang:1.24.0-alpine AS build

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal

RUN go build -o /bin/api ./cmd/api
RUN go build -o /bin/worker ./cmd/worker

FROM alpine:3.20

RUN adduser -D -g '' appuser
USER appuser

COPY --from=build /bin/api /bin/api
COPY --from=build /bin/worker /bin/worker

EXPOSE 8080

CMD ["/bin/api"]
