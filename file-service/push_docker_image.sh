#!/usr/bin/env bash
set -euo pipefail

# Manual Docker build + push to Aliyun ACR.
# Mirrors .github/workflows/ci.yml behavior by default.

DEFAULT_REGISTRY="registry.cn-hangzhou.aliyuncs.com"
DEFAULT_REPO_PATH="zhoupb/file-service"
DEFAULT_TAG="latest"
DEFAULT_CONTEXT="."

usage() {
  cat <<'EOF'
Usage:
  REGISTRY_USERNAME=xxx REGISTRY_PASSWORD=yyy \
    ./push_docker_image.sh [--tag TAG] [--image IMAGE] [--context PATH] [--no-login]

Defaults:
  --image   registry.cn-hangzhou.aliyuncs.com/zhoupb/file-service:latest
  --tag     latest
  --context .

Examples:
  # Push latest
  REGISTRY_USERNAME=xxx REGISTRY_PASSWORD=yyy ./push_docker_image.sh

  # Push current git SHA
  REGISTRY_USERNAME=xxx REGISTRY_PASSWORD=yyy ./push_docker_image.sh --tag "$(git rev-parse --short HEAD)"

  # Push a custom image name
  REGISTRY_USERNAME=xxx REGISTRY_PASSWORD=yyy ./push_docker_image.sh --image registry.cn-hangzhou.aliyuncs.com/zhoupb/file-service --tag v1.2.3

Notes:
  - Set REGISTRY_USERNAME / REGISTRY_PASSWORD in your shell (same names as GitHub secrets).
  - Requires: docker
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Error: missing required command: $1" >&2
    exit 1
  }
}

ensure_docker_running() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi

  if command -v service >/dev/null 2>&1; then
    echo "Docker daemon not running, starting via service..."
    if service docker start >/dev/null 2>&1; then
      if docker info >/dev/null 2>&1; then
        return 0
      fi
    fi
  fi

  echo "Error: docker daemon is not running." >&2
  echo "Hint: start it with 'service docker start'." >&2
  exit 1
}

TAG="$DEFAULT_TAG"
CONTEXT="$DEFAULT_CONTEXT"
NO_LOGIN=0

# IMAGE is passed as repo without tag, e.g. registry.xxx.com/ns/name
IMAGE_REPO="${DEFAULT_REGISTRY}/${DEFAULT_REPO_PATH}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --tag)
      TAG="${2:-}"
      shift 2
      ;;
    --image)
      IMAGE_REPO="${2:-}"
      shift 2
      ;;
    --context)
      CONTEXT="${2:-}"
      shift 2
      ;;
    --no-login)
      NO_LOGIN=1
      shift 1
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo
      usage
      exit 2
      ;;
  esac
done

if [[ -z "$TAG" ]]; then
  echo "Error: --tag cannot be empty" >&2
  exit 2
fi

if [[ -z "$IMAGE_REPO" ]]; then
  echo "Error: --image cannot be empty" >&2
  exit 2
fi

require_cmd docker
ensure_docker_running

FULL_IMAGE="${IMAGE_REPO}:${TAG}"

# Extract registry host for docker login.
# For 'registry.cn-hangzhou.aliyuncs.com/zhoupb/file-service' -> 'registry.cn-hangzhou.aliyuncs.com'
REGISTRY_HOST="${IMAGE_REPO%%/*}"

if [[ "$NO_LOGIN" -eq 0 ]]; then
  if [[ -n "${REGISTRY_USERNAME:-}" && -n "${REGISTRY_PASSWORD:-}" ]]; then
    echo "Logging in to ${REGISTRY_HOST}..."
    printf '%s' "$REGISTRY_PASSWORD" | docker login "$REGISTRY_HOST" -u "$REGISTRY_USERNAME" --password-stdin >/dev/null
  else
    echo "Skipping docker login (REGISTRY_USERNAME/REGISTRY_PASSWORD not set)."
  fi
fi

echo "Building ${FULL_IMAGE} from context '${CONTEXT}'..."
docker build -t "$FULL_IMAGE" "$CONTEXT"

echo "Pushing ${FULL_IMAGE}..."
docker push "$FULL_IMAGE"

echo "Done: ${FULL_IMAGE}"
