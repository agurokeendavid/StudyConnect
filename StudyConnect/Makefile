.PHONY: help build up down restart logs clean rebuild

help: ## Show this help message
	@echo "StudyConnect Docker Commands"
	@echo "============================"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

build: ## Build the Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d
	@echo "? Services started!"
	@echo "?? Web: http://localhost:5000"
	@echo "???  MySQL: localhost:3006"

start: up ## Alias for up

dev: ## Start services with build and show logs
	docker-compose up --build

down: ## Stop all services
	docker-compose down

stop: down ## Alias for down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs (follow mode)
	docker-compose logs -f

logs-web: ## Show web application logs
	docker-compose logs -f web

logs-mysql: ## Show MySQL logs
	docker-compose logs -f mysql

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v
	@echo "? Cleaned up all containers, networks, and volumes"

rebuild: clean ## Clean and rebuild everything
	docker-compose up --build -d
	@echo "? Rebuilt and started all services"

shell-web: ## Open shell in web container
	docker exec -it studyconnect-web /bin/bash

shell-mysql: ## Open MySQL shell
	docker exec -it studyconnect-mysql mysql -u root StudyConnectDb

ps: ## Show container status
	docker-compose ps

backup-db: ## Backup database to backup.sql
	docker exec studyconnect-mysql mysqldump -u root StudyConnectDb > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "? Database backed up"

restore-db: ## Restore database from backup.sql (Usage: make restore-db FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "? Please specify FILE=<backup_file>"; \
		exit 1; \
	fi
	docker exec -i studyconnect-mysql mysql -u root StudyConnectDb < $(FILE)
	@echo "? Database restored"

health: ## Check health of services
	@docker-compose ps
	@echo ""
	@echo "MySQL Health:"
	@docker exec studyconnect-mysql mysqladmin ping -u root || echo "? MySQL not healthy"
	@echo ""
	@echo "Web Application:"
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:5000 || echo "? Web app not responding"
