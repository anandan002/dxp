.PHONY: help up down dev dev-bff dev-portal build-storybook test lint clean status

COMPOSE = docker compose

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start infrastructure (Keycloak + Kong; uses local Postgres & Redis)
	$(COMPOSE) up -d
	@echo "\n--- DXP Infrastructure ---"
	@echo "PostgreSQL:  localhost:5432 (local)"
	@echo "Redis:       localhost:6379 (local)"
	@echo "Keycloak:    http://localhost:8080 (admin/admin)"
	@echo "Kong:        http://localhost:8000"

down: ## Stop Docker services
	$(COMPOSE) down

dev: ## Start everything (BFF + Portal on localhost:4200)
	@echo "Starting BFF on :4201 and Portal on :4200..."
	@echo "Open http://localhost:4200"
	@echo ""
	@echo "  /              Portal (Dashboard, Policies, Claims, Documents)"
	@echo "  /playground    API Playground (auth + live API tester)"
	@echo "  /docs          Documentation"
	@echo "  /storybook     Component Playground"
	@echo "  /api/docs      Swagger API Docs"
	@echo ""
	cd apps/bff && pnpm start:dev &
	cd starters/insurance-portal && pnpm dev

dev-bff: ## Start BFF only
	cd apps/bff && pnpm start:dev

dev-portal: ## Start portal only (requires BFF running)
	cd starters/insurance-portal && pnpm dev

build-storybook: ## Rebuild Storybook static into portal
	cd packages/ui && npx storybook build -o ../../starters/insurance-portal/public/storybook

test: ## Run all tests
	pnpm nx run-many -t test

lint: ## Run linters
	pnpm nx run-many -t lint

clean: ## Clean build artifacts
	rm -rf dist/ .nx/ node_modules/.cache
	@echo "Clean complete"

status: ## Check all services
	@echo "--- Service Health ---"
	@pg_isready -h localhost -p 5432 > /dev/null 2>&1 && echo "PostgreSQL: UP (local)" || echo "PostgreSQL: DOWN"
	@redis-cli ping > /dev/null 2>&1 && echo "Redis:      UP (local)" || echo "Redis:      DOWN"
	@curl -sf http://localhost:8080/realms/dxp > /dev/null 2>&1 && echo "Keycloak:   UP (dxp realm)" || echo "Keycloak:   DOWN"
	@curl -sf http://localhost:8001/status > /dev/null 2>&1 && echo "Kong:       UP" || echo "Kong:       DOWN"
	@curl -sf http://localhost:4201/api/v1/health > /dev/null 2>&1 && echo "BFF:        UP (:4201)" || echo "BFF:        DOWN"
	@curl -sf http://localhost:4200 > /dev/null 2>&1 && echo "Portal:     UP (:4200)" || echo "Portal:     DOWN"
