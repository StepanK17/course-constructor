.PHONY: help up down ps logs build restart migrate

help:
	@echo "Targets:"
	@echo "  up       Start all services (docker compose up --build)"
	@echo "  down     Stop all services (docker compose down)"
	@echo "  ps       Show running services"
	@echo "  logs     Follow logs for all services"
	@echo "  build    Build images"
	@echo "  restart  Restart services"
	@echo "  migrate  Apply database migrations"

up:
	docker compose up --build

down:
	docker compose down

ps:
	docker compose ps

logs:
	docker compose logs -f

build:
	docker compose build

restart:
	docker compose restart

migrate:
	docker compose run --rm migrate
