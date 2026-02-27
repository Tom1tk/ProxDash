#!/bin/bash
set -e

echo "==> Creating ProxDash LXC container (ID 130)"

# Create Debian 12 LXC
pct create 130 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname proxdash \
  --cores 1 \
  --memory 512 \
  --swap 256 \
  --rootfs local-lvm:4 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --ostype debian \
  --unprivileged 1 \
  --start 1

echo "==> Waiting for container to start..."
sleep 5

echo "==> Setting up networking..."
pct exec 130 -- bash -c "apt update && apt install -y curl"

# Get IP and set static
echo "==> Container created. Note the DHCP IP, then set static in router or run:"
echo "==> pct exec 130 -- bash -c \"echo 'auto eth0\\niface eth0 inet static\\n  address 192.168.68.20\\n  netmask 255.255.252.0\\n  gateway 192.168.68.1' > /etc/network/interfaces.d/eth0\""
