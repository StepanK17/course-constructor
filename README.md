
# Course Constructor UI + Backend

Этот репозиторий содержит фронтенд UI и Go‑бэкенд для платформы «Конструктор курсов».

Текущее состояние: бэкенд генерирует и хранит единый структурированный текст (LLM‑стиль) для каждого курса.
Фронтенд показывает этот текст как единое сообщение (пока без модулей/уроков).

## Что готово

- Бэкенд API на Go (auth, документы, курсы, прогресс, очереди)
- PostgreSQL для основных данных, Redis для очередей, MinIO для хранения файлов
- Демо‑воркер, который пишет единый текст в `courses.content_text`
- Фронтенд, который:
  - показывает список курсов
  - запускает генерацию курса
  - дает выбор источников (интернет или загруженные документы)
  - отображает курс как один текст
- Docker Compose со всеми сервисами

## Архитектура

Сервисы (Docker Compose):
- `backend` (Go API)
- `worker` (демо генератор текста)
- `db` (PostgreSQL)
- `redis`
- `minio` (S3‑совместимое хранилище)
- `frontend` (Vite dev server)
- `migrate` (миграции БД)

Поток данных:
1) Пользователь создает курс в UI.
2) Бэкенд создает `generation_tasks` и кладет задачу в Redis.
3) Воркер забирает задачу и пишет полный текст в `courses.content_text`.
4) UI опрашивает `/api/v1/courses/{id}/content` до `status=ready`.

## Запуск через Docker (рекомендовано)

```bash
docker compose up --build
```

Адреса:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- MinIO Console: http://localhost:9001 (логин: `minio`, пароль: `minio123`)

## Команды Makefile

```bash
make up        # docker compose up --build
make down      # docker compose down
make ps        # docker compose ps
make logs      # docker compose logs -f
make migrate   # применить миграции
```

## API (текущее)

Auth:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

Documents:
- `POST /api/v1/documents/` (загрузка)
- `GET /api/v1/documents/` (список)
- `GET /api/v1/documents/{id}`
- `DELETE /api/v1/documents/{id}`

Courses:
- `POST /api/v1/courses/generate`
- `GET /api/v1/courses/`
- `GET /api/v1/courses/{id}`
- `DELETE /api/v1/courses/{id}`
- `GET /api/v1/courses/{id}/status`
- `GET /api/v1/courses/{id}/content` (единый текст)

Lessons (легаси, пока не используется в UI):
- `GET /api/v1/courses/{id}/lessons`
- `GET /api/v1/lessons/{id}`

## Хранение данных

- Загруженные файлы лежат в MinIO, бакет `course-constructor`.
- Метаданные документов в таблице `documents`.
- Текст курса хранится в `courses.content_text`.

## Переменные окружения (backend)

`docker-compose.yml` уже содержит значения по умолчанию. Если запускать локально, нужно минимум:

- `DB_DSN`
- `REDIS_ADDR`
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`
- `JWT_SECRET`

## Примечания

- Воркер сейчас демо‑версия. Позже заменить на реальный LLM‑сервис.
- UI упрощен под единый текстовый ответ.
  
