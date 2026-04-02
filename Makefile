.PHONY: help up down dev dev-bff dev-portal dev-payer build-storybook test lint clean status fhir-seed fhir-reset

COMPOSE = docker compose

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start infrastructure (Keycloak + Kong + HAPI FHIR; uses local Postgres & Redis)
	@createdb hapi_fhir 2>/dev/null || true
	$(COMPOSE) up -d
	@echo "\n--- DXP Infrastructure ---"
	@echo "PostgreSQL:  localhost:5432 (local)"
	@echo "Redis:       localhost:6379 (local)"
	@echo "Keycloak:    http://localhost:5025 (admin/admin)"
	@echo "Kong:        http://localhost:5026"
	@echo "HAPI FHIR:   http://localhost:5028/fhir"

down: ## Stop Docker services
	$(COMPOSE) down

dev: ## Start everything (BFF + Portal on localhost:5020)
	@echo "Starting BFF on :5021 and Portal on :5020..."
	@echo "Open http://localhost:5020"
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

dev-payer: ## Start full payer stack (BFF + Portal + Playground + Storybook + IDP)
	@bash dev.sh

dev-payer-no-infra: ## Start payer stack without Docker (infra already running)
	@bash dev.sh --no-infra

fhir-seed: ## Seed HAPI FHIR with synthetic payer data
	cd apps/bff && pnpm seed:fhir

fhir-reset: ## Reset HAPI FHIR (drop + recreate + reseed)
	@dropdb hapi_fhir 2>/dev/null || true
	@createdb hapi_fhir
	$(COMPOSE) restart hapi-fhir
	@echo "Waiting for HAPI FHIR to start..."
	@sleep 30
	cd apps/bff && pnpm seed:fhir

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
	@curl -sf http://localhost:5025/realms/dxp > /dev/null 2>&1 && echo "Keycloak:   UP (dxp realm)" || echo "Keycloak:   DOWN"
	@curl -sf http://localhost:5027/status > /dev/null 2>&1 && echo "Kong:       UP" || echo "Kong:       DOWN"
	@curl -sf http://localhost:5028/fhir/metadata > /dev/null 2>&1 && echo "HAPI FHIR:  UP (:5028)" || echo "HAPI FHIR:  DOWN"
	@curl -sf http://localhost:5021/api/v1/health > /dev/null 2>&1 && echo "BFF:        UP (:5021)" || echo "BFF:        DOWN"
	@curl -sf http://localhost:5020 > /dev/null 2>&1 && echo "Portal:     UP (:5020)" || echo "Portal:     DOWN"
	@curl -sf http://localhost:5022 > /dev/null 2>&1 && echo "Payer:      UP (:5022)" || echo "Payer:      DOWN"
	@curl -sf http://localhost:5023 > /dev/null 2>&1 && echo "Playground: UP (:5023)" || echo "Playground: DOWN"
	@curl -sf http://localhost:5024 > /dev/null 2>&1 && echo "Storybook:  UP (:5024)" || echo "Storybook:  DOWN"

