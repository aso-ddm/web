.PHONY: init
init: build install up
.PHONY: build
build:
	docker compose build
.PHONY: up
up:
	docker compose up -d
.PHONY: stop
stop:
	docker compose stop
.PHONY: install
install:
	docker compose run --user=node --rm node sh -lc 'pnpm install && pnpm run build'
.PHONY: deploy
deploy:
	docker compose exec --user=node node sh -lc 'pnpm run build'
.PHONY: bash
bash:
	docker compose exec --user=node node /bin/bash
.PHONY: ps
ps: ## docker compose ps
	docker compose ps
