.PHONY: build up down logs restart clean prepare-env

# Default target
all: up

# Prepare environment files
prepare-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created from example"; \
	fi
	@echo "Please update your environment variables in .env"

# Build the containers
build:
	docker compose build

# Start the containers
up:
	docker compose up -d

# Stop the containers
down:
	docker compose down

# Stop containers and remove volumes
clean:
	docker compose down -v

# View logs
logs:
	docker compose logs -f

# Restart containers
restart:
	docker compose restart

# Build and start
setup: prepare-env build up
	@echo "Application is now running at http://localhost:3000" 