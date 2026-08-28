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

cleanup_docker_space() {
  # Running containers and Docker volumes are not affected by these commands.
  docker image prune -af || true
  docker builder prune -af || true
}

cleanup_after_failure() {
  exit_code="$?"
  trap - EXIT

  if [[ "$exit_code" -ne 0 ]]; then
    echo "Deployment failed. Removing artifacts left by the interrupted build..."
    cleanup_docker_space
  fi

  exit "$exit_code"
}

trap cleanup_after_failure EXIT

echo "[1/9] Reclaiming Docker space before the build..."
cleanup_docker_space
df -h "$APP_DIR" || true

echo "[2/9] Building the production image..."
docker compose build --pull web

echo "[3/9] Applying pending Prisma migrations..."
docker compose run --rm --no-deps web npm run db:migrate:deploy

echo "[4/9] Synchronizing categories and AI tools..."
docker compose run --rm --no-deps web npm run catalog:sync

echo "[5/9] Synchronizing MCP, skills, and repositories..."
docker compose run --rm --no-deps web npm run resources:sync:collective

echo "[6/9] Synchronizing curated and selected external prompts..."
docker compose run --rm --no-deps web npm run resources:sync:prompts

echo "[7/9] Translating new skills and repositories..."
docker compose run --rm --no-deps web npm run resources:translate:ru

echo "[8/9] Starting the updated application..."
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

echo "[9/9] Removing old images and build cache..."
cleanup_docker_space
df -h "$APP_DIR" || true

trap - EXIT

echo "Deployment completed successfully."
