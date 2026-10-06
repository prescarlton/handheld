#!/usr/bin/env bash
# Build locally and push to the device over SSH. Usage: ./system/scripts/deploy.sh pi@handheld.local
set -euo pipefail
TARGET="${1:?usage: deploy.sh user@host}"

pnpm build
rsync -az --delete services/daemon/dist/ "$TARGET:/tmp/handheld/services/daemon/dist/"
rsync -az --delete apps/shell/dist/ "$TARGET:/tmp/handheld/apps/shell/dist/"
ssh "$TARGET" 'sudo rsync -a /tmp/handheld/ /opt/handheld/ && sudo systemctl restart handheld-daemon handheld-ui'
echo "Deployed to $TARGET"
