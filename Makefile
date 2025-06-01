 # Load environment variables from .env file
include .env
export

# Docker Compose commands
.PHONY: build up down restart logs clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  make build    - Build all services"
	@echo "  make up      - Start all services"
	@echo "  make down    - Stop all services"
	@echo "  make restart - Restart all services"
	@echo "  make logs    - Show logs from all services"
	@echo "  make clean   - Remove all containers, networks, and volumes"

# Build services
build:
	@echo "Building services..."
	docker compose build

# Start services
up:
	@echo "Starting services..."
	docker compose up -d

# Stop services
down:
	@echo "Stopping services..."
	docker compose down

# Restart services
restart: down up

# Show logs
logs:
	@echo "Showing logs..."
	docker compose logs -f

# Clean up
clean:
	@echo "Cleaning up..."
	docker compose down -v
	docker system prune -f

# Development specific commands
.PHONY: dev-build dev-up dev-down dev-logs

# Build development services
dev-build:
	@echo "Building development services..."
	docker compose build frontend backend

# Start development services
dev-up:
	@echo "Starting development services..."
	docker compose up -d frontend backend mysql

# Stop development services
dev-down:
	@echo "Stopping development services..."
	docker compose stop frontend backend

# Show development logs
dev-logs:
	@echo "Showing development logs..."
	docker compose logs -f frontend backend

# Production specific commands
.PHONY: prod-build prod-up prod-down prod-logs

# Build production services
prod-build:
	@echo "Building production services..."
	docker compose build nginx backend

# Start production services
prod-up:
	@echo "Starting production services..."
	docker compose up -d nginx backend mysql

# Stop production services
prod-down:
	@echo "Stopping production services..."
	docker compose stop nginx backend

# Show production logs
prod-logs:
	@echo "Showing production logs..."
	docker compose logs -f nginx backend