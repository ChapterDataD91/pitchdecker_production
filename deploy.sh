#!/usr/bin/env bash
# ============================================================================
# PitchDecker — Build, Push & Deploy
# ============================================================================
# Builds the Next.js app image, pushes to ACR, and updates the Azure
# Container App. Auto-increments the version tag in docker-compose.yml.
#
# Usage:
#   ./deploy.sh
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# ── Configuration ────────────────────────────────────────────────────────────

ACR_NAME="ixion"
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
RESOURCE_GROUP="Tidus"
SUBSCRIPTION_ID="7b32fa30-1ded-4806-b495-7eebfcb48cbc"
APP_NAME="pitchdecker-app"
COMPOSE_FILE="docker-compose.yml"

# ── Helpers ──────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[deploy]${NC} $*"; }
ok()  { echo -e "${GREEN}[  ok  ]${NC} $*"; }
err() { echo -e "${RED}[error ]${NC} $*" >&2; }

# ── Verify prerequisites ────────────────────────────────────────────────────

if ! command -v az &>/dev/null; then
    err "Azure CLI not found. Install: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

if ! command -v docker &>/dev/null; then
    err "Docker not found"
    exit 1
fi

if ! az account show &>/dev/null; then
    err "Not logged in to Azure. Run: az login"
    exit 1
fi

az account set --subscription "$SUBSCRIPTION_ID"
ok "Azure subscription set"

log "Logging into ACR '${ACR_NAME}'..."
az acr login --name "$ACR_NAME"
ok "ACR login successful"

# ── Extract and increment version ────────────────────────────────────────────

IMAGE_LINE=$(grep 'image:' "$PROJECT_ROOT/$COMPOSE_FILE" | head -1 | awk '{print $2}')
IMAGE_NAME="${IMAGE_LINE%%:*}"
OLD_TAG="${IMAGE_LINE##*:}"

OLD_NUM="${OLD_TAG#v}"
NEW_NUM=$((OLD_NUM + 1))
NEW_TAG="v${NEW_NUM}"

# Update compose file with new tag
sed -i '' "s|${IMAGE_NAME}:${OLD_TAG}|${IMAGE_NAME}:${NEW_TAG}|" "$PROJECT_ROOT/$COMPOSE_FILE"

ACR_IMAGE="${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${NEW_TAG}"

log "Version: ${OLD_TAG} → ${NEW_TAG}"
log "ACR target: ${ACR_IMAGE}"

# ── Build Docker image ───────────────────────────────────────────────────────

log "Building Docker image (this includes Next.js build)..."
docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" build --no-cache
ok "Image built"

# ── Tag and push ─────────────────────────────────────────────────────────────

log "Tagging for ACR..."
docker tag "${IMAGE_NAME}:${NEW_TAG}" "$ACR_IMAGE"
ok "Tagged"

log "Pushing to ACR..."
docker push "$ACR_IMAGE"
ok "Image pushed"

# ── Update Container App ─────────────────────────────────────────────────────

log "Updating Container App '${APP_NAME}'..."
REVISION_SUFFIX="$(date +%Y%m%d%H%M%S)"
az containerapp update \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$ACR_IMAGE" \
    --revision-suffix "$REVISION_SUFFIX" \
    --output none
ok "Container App updated (revision: ${REVISION_SUFFIX})"

# ── Verify ───────────────────────────────────────────────────────────────────

APP_FQDN=$(az containerapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

log "Waiting for deployment..."
sleep 10

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_FQDN}" || true)
if [[ "$HEALTH_STATUS" == "200" ]]; then
    ok "Health check passed"
else
    err "Health check returned ${HEALTH_STATUS} — check container logs"
    log "View logs: az containerapp logs show --name ${APP_NAME} --resource-group ${RESOURCE_GROUP} --follow"
fi

echo ""
echo "============================================================================"
echo -e "${GREEN} Deployed: https://${APP_FQDN}${NC}"
echo -e "${GREEN} Version:  ${NEW_TAG}${NC}"
echo "============================================================================"
