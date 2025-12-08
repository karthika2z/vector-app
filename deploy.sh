#!/bin/bash
#===============================================================================
# Vector App Deployment Script
# Comprehensive deployment with rollback support, health checks, and logging
#===============================================================================

set -e  # Exit on error

# Configuration
APP_NAME="vector-app"
APP_DIR="/home/ubuntu/vector-app"
BACKUP_DIR="/home/ubuntu/backups"
NGINX_DIR="/home/ubuntu/vector-app/dist"
LOG_FILE="/var/log/vector-deploy.log"
GITHUB_REPO="https://github.com/karthika2z/vector-app.git"
MAX_BACKUPS=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | sudo tee -a "$LOG_FILE"

    case $level in
        INFO)  echo -e "${BLUE}[INFO]${NC} $message" ;;
        OK)    echo -e "${GREEN}[OK]${NC} $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $message" ;;
    esac
}

# Error handler
error_exit() {
    log "ERROR" "$1"
    log "ERROR" "Deployment failed! Check $LOG_FILE for details."
    exit 1
}

# Create backup of current deployment
create_backup() {
    log "INFO" "Creating backup of current deployment..."

    sudo mkdir -p "$BACKUP_DIR"

    if [ -d "$NGINX_DIR" ]; then
        local backup_name="backup_$(date '+%Y%m%d_%H%M%S')"
        sudo cp -r "$NGINX_DIR" "$BACKUP_DIR/$backup_name"
        log "OK" "Backup created: $BACKUP_DIR/$backup_name"

        # Clean old backups (keep only MAX_BACKUPS)
        cd "$BACKUP_DIR"
        ls -t | tail -n +$((MAX_BACKUPS + 1)) | xargs -r sudo rm -rf
        log "INFO" "Old backups cleaned (keeping last $MAX_BACKUPS)"
    else
        log "WARN" "No existing deployment to backup"
    fi
}

# Rollback to previous backup
rollback() {
    log "WARN" "Rolling back to previous deployment..."

    local latest_backup=$(ls -t "$BACKUP_DIR" 2>/dev/null | head -1)

    if [ -n "$latest_backup" ]; then
        sudo rm -rf "$NGINX_DIR"
        sudo cp -r "$BACKUP_DIR/$latest_backup" "$NGINX_DIR"
        sudo systemctl reload nginx
        log "OK" "Rolled back to: $latest_backup"
    else
        error_exit "No backup available for rollback!"
    fi
}

# Pull latest code from git
pull_code() {
    log "INFO" "Pulling latest code from GitHub..."

    cd "$APP_DIR"

    # Check if it's a git repo
    if [ ! -d ".git" ]; then
        log "INFO" "Initializing git repository..."
        git init
        git remote add origin "$GITHUB_REPO" 2>/dev/null || git remote set-url origin "$GITHUB_REPO"
    fi

    # Fetch and reset to latest
    git fetch origin main
    git reset --hard origin/main

    log "OK" "Code updated to latest commit: $(git rev-parse --short HEAD)"
}

# Install dependencies
install_deps() {
    log "INFO" "Installing npm dependencies..."

    cd "$APP_DIR"
    npm install --production=false

    log "OK" "Dependencies installed successfully"
}

# Build the application
build_app() {
    log "INFO" "Building application..."

    cd "$APP_DIR"

    # Check for .env.local
    if [ ! -f ".env.local" ]; then
        log "WARN" ".env.local not found - creating from template"
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            log "WARN" "Please update .env.local with actual API keys!"
        fi
    fi

    npm run build

    if [ ! -d "dist" ]; then
        error_exit "Build failed - dist directory not created!"
    fi

    log "OK" "Build completed successfully"
}

# Set proper permissions
set_permissions() {
    log "INFO" "Setting file permissions..."

    # Ensure nginx can read the files
    chmod -R 755 "$NGINX_DIR"
    chmod o+x /home/ubuntu

    log "OK" "Permissions set correctly"
}

# Restart nginx
restart_nginx() {
    log "INFO" "Testing nginx configuration..."

    sudo nginx -t

    log "INFO" "Restarting nginx..."
    sudo systemctl reload nginx

    log "OK" "Nginx reloaded successfully"
}

# Health check - test if app is serving
health_check() {
    log "INFO" "Running health checks..."

    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log "INFO" "Health check attempt $attempt/$max_attempts..."

        # Test HTTPS endpoint
        local http_code=$(curl -sk -o /dev/null -w "%{http_code}" https://localhost/)

        if [ "$http_code" = "200" ]; then
            log "OK" "Application is responding (HTTP $http_code)"
            break
        else
            log "WARN" "Got HTTP $http_code, retrying..."
            sleep 2
        fi

        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        error_exit "Health check failed after $max_attempts attempts!"
    fi
}

# Test external connectivity
test_connectivity() {
    log "INFO" "Testing external connectivity..."

    # Test OpenAI API
    local openai_status=$(curl -s -o /dev/null -w "%{http_code}" https://api.openai.com/v1/models)
    if [ "$openai_status" = "401" ] || [ "$openai_status" = "200" ]; then
        log "OK" "OpenAI API reachable (HTTP $openai_status)"
    else
        log "WARN" "OpenAI API may not be reachable (HTTP $openai_status)"
    fi

    # Test LiveKit
    local livekit_status=$(curl -s -o /dev/null -w "%{http_code}" https://vec-tor-sxq3ar52.livekit.cloud)
    if [ "$livekit_status" = "200" ] || [ "$livekit_status" = "404" ]; then
        log "OK" "LiveKit server reachable (HTTP $livekit_status)"
    else
        log "WARN" "LiveKit server may not be reachable (HTTP $livekit_status)"
    fi
}

# Print deployment summary
print_summary() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}DEPLOYMENT SUCCESSFUL!${NC}"
    echo "=========================================="
    echo ""
    echo "Deployment Details:"
    echo "  - App Directory: $APP_DIR"
    echo "  - Commit: $(cd $APP_DIR && git rev-parse --short HEAD)"
    echo "  - Time: $(date)"
    echo ""
    echo "Access URLs:"
    echo "  - HTTPS: https://98.92.33.15"
    echo ""
    echo "Service Status:"
    sudo systemctl status nginx --no-pager | head -5
    echo ""
    echo "To view logs: sudo tail -f $LOG_FILE"
    echo "To rollback:  $0 rollback"
    echo "=========================================="
}

# Print usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy    Full deployment (default)"
    echo "  rollback  Rollback to previous version"
    echo "  status    Check deployment status"
    echo "  logs      View deployment logs"
    echo "  help      Show this help"
}

# Check status
check_status() {
    echo "=== System Status ==="
    echo ""
    echo "Nginx Status:"
    sudo systemctl status nginx --no-pager | head -5
    echo ""
    echo "Latest Commit:"
    cd "$APP_DIR" && git log -1 --oneline
    echo ""
    echo "Disk Usage:"
    df -h / | tail -1
    echo ""
    echo "Memory:"
    free -h | head -2
    echo ""
    echo "App Health:"
    curl -sk -o /dev/null -w "HTTPS: %{http_code}\n" https://localhost/
}

#===============================================================================
# Main Script
#===============================================================================

# Ensure script is run with proper permissions
if [ "$EUID" -eq 0 ]; then
    log "WARN" "Running as root - this is not recommended"
fi

# Parse command
case "${1:-deploy}" in
    deploy)
        log "INFO" "Starting deployment of $APP_NAME..."
        echo ""

        create_backup
        pull_code
        install_deps
        build_app
        set_permissions
        restart_nginx
        health_check
        test_connectivity
        print_summary
        ;;

    rollback)
        rollback
        restart_nginx
        health_check
        log "OK" "Rollback completed successfully"
        ;;

    status)
        check_status
        ;;

    logs)
        sudo tail -f "$LOG_FILE"
        ;;

    help|--help|-h)
        usage
        ;;

    *)
        echo "Unknown command: $1"
        usage
        exit 1
        ;;
esac
