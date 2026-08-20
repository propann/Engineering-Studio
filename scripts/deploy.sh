#!/bin/bash

# Deploy script for Studio Hub - Audio Plugin Rack
# Usage: ./scripts/deploy.sh [environment] [version]

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
APP_NAME="studio-hub"
REGISTRY="docker.io"
IMAGE_NAME="${REGISTRY}/${APP_NAME}"
CONTAINER_NAME="${APP_NAME}-${ENVIRONMENT}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    command -v docker &> /dev/null || log_error "Docker is not installed"
    command -v docker-compose &> /dev/null || log_error "Docker Compose is not installed"
    command -v git &> /dev/null || log_error "Git is not installed"

    log_success "Prerequisites OK"
}

# Load environment
load_environment() {
    log_info "Loading environment: $ENVIRONMENT"

    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        log_error "Environment file .env.${ENVIRONMENT} not found"
    fi

    # Source environment file
    export $(cat ".env.${ENVIRONMENT}" | grep -v '#' | xargs)

    log_success "Environment loaded"
}

# Build Docker image
build_image() {
    log_info "Building Docker image: ${IMAGE_NAME}:${VERSION}"

    docker build \
        --tag "${IMAGE_NAME}:${VERSION}" \
        --tag "${IMAGE_NAME}:latest" \
        --build-arg NODE_ENV="${ENVIRONMENT}" \
        --label "build.date=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --label "vcs.ref=$(git rev-parse --short HEAD)" \
        --label "version=${VERSION}" \
        .

    log_success "Image built successfully"
}

# Run tests
run_tests() {
    log_info "Running tests..."

    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        "${IMAGE_NAME}:${VERSION}" \
        npm run test -- --run --coverage

    log_success "Tests passed"
}

# Stop existing container
stop_container() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "Stopping existing container: ${CONTAINER_NAME}"
        docker stop "${CONTAINER_NAME}" || true
        docker rm "${CONTAINER_NAME}" || true
        log_success "Container stopped"
    fi
}

# Start container
start_container() {
    log_info "Starting container: ${CONTAINER_NAME}"

    docker run -d \
        --name "${CONTAINER_NAME}" \
        -p 3000:3000 \
        --restart unless-stopped \
        --env-file ".env.${ENVIRONMENT}" \
        -v "${APP_NAME}-data:/app/data" \
        "${IMAGE_NAME}:${VERSION}"

    log_success "Container started"
}

# Health check
health_check() {
    log_info "Performing health check..."

    sleep 5  # Wait for container to start

    for i in {1..30}; do
        if curl -s http://localhost:3000/ &> /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        log_info "Health check attempt $i/30..."
        sleep 2
    done

    log_error "Health check failed after 30 attempts"
}

# Display container info
show_info() {
    log_info "Container Information:"
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

    echo ""
    log_info "Access the application at:"
    echo "  http://localhost:3000/"
}

# Cleanup on error
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed"
        stop_container
        exit 1
    fi
}

trap cleanup EXIT

# Main deployment flow
main() {
    log_info "=========================================="
    log_info "Studio Hub Deployment Script"
    log_info "=========================================="
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info ""

    check_prerequisites
    load_environment
    build_image

    if [ "$ENVIRONMENT" = "production" ]; then
        run_tests
    fi

    stop_container
    start_container
    health_check
    show_info

    log_info "=========================================="
    log_success "Deployment completed successfully!"
    log_info "=========================================="
}

# Run main function
main
