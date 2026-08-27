#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed on the server."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is not available on the server."
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Missing $APP_DIR/.env. Create it before the first deployment."
  exit 1
fi

docker compose config --quiet

echo "[1/7] Building the production image..."
docker compose build --pull web

echo "[2/7] Applying pending Prisma migrations..."
docker compose run --rm --no-deps web npm run db:migrate:deploy

echo "[3/7] Synchronizing categories and AI tools..."
docker compose run --rm --no-deps web npm run catalog:sync

echo "[4/7] Synchronizing MCP, prompts, skills, and repositories..."
docker compose run --rm --no-deps web npm run resources:sync:collective

echo "[5/7] Translating new prompts, skills, and repositories..."
docker compose run --rm --no-deps web npm run resources:translate:ru

echo "[6/7] Starting the updated application..."
docker compose up -d --remove-orphans web

container_id="$(docker compose ps -q web)"
if [[ -z "$container_id" ]]; then
  echo "The web container was not created."
  exit 1
fi

for attempt in {1..40}; do
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"

  if [[ "$status" == "healthy" ]]; then
    echo "Application is healthy."
    break
  fi

  if [[ "$status" == "unhealthy" || "$status" == "exited" || "$status" == "dead" ]]; then
    echo "Application failed with status: $status"
    docker compose logs --tail=150 web
    exit 1
  fi

  if [[ "$attempt" -eq 40 ]]; then
    echo "Application did not become healthy in time."
    docker compose logs --tail=150 web
    exit 1
  fi

  sleep 3
done

echo "[7/7] Removing dangling Docker images..."
docker image prune -f

echo "Deployment completed successfully."
