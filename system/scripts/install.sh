#!/usr/bin/env bash
# Install onto the device. Run from the repo root on the device, after `pnpm install && pnpm build`.
# Expects: node >= 20, cog, NetworkManager, BlueZ, polkit.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo ./system/scripts/install.sh" >&2
  exit 1
fi

for bin in node cog nmcli bluetoothctl; do
  command -v "$bin" >/dev/null || echo "warning: $bin not found on PATH" >&2
done

[[ -f services/daemon/dist/daemon.js && -f apps/shell/dist/index.html ]] || {
  echo "Build first: pnpm install && pnpm build" >&2
  exit 1
}

id handheld &>/dev/null || useradd --system --create-home --shell /usr/sbin/nologin handheld
usermod -aG video,render,input,audio,bluetooth,netdev handheld 2>/dev/null || true

install -d /opt/handheld/services/daemon /opt/handheld/apps/shell /etc/handheld
rm -rf /opt/handheld/services/daemon/dist /opt/handheld/apps/shell/dist
cp -r services/daemon/dist /opt/handheld/services/daemon/
cp -r apps/shell/dist /opt/handheld/apps/shell/
[[ -f /etc/handheld/handheld.env ]] || install -m 644 system/handheld.env /etc/handheld/handheld.env

install -m 644 system/systemd/handheld-daemon.service /etc/systemd/system/
install -m 644 system/systemd/handheld-ui.service /etc/systemd/system/
install -d /etc/polkit-1/rules.d
install -m 644 system/polkit/50-handheld.rules /etc/polkit-1/rules.d/

systemctl daemon-reload
systemctl enable --now handheld-daemon.service handheld-ui.service
echo "Installed. Logs: journalctl -u handheld-daemon -u handheld-ui -f"
