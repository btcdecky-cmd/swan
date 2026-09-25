#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "==> Checking tooling"
command -v solana >/dev/null || { echo "Install Solana CLI"; exit 1; }
command -v anchor >/dev/null || { echo "Install Anchor"; exit 1; }
solana config set --url devnet
solana config get
echo "==> Build"
anchor build || exit 1
echo "==> Deploy"
anchor deploy --provider.cluster devnet
echo "Next: set SWAN_PROGRAM_ID / VITE_SWAN_PROGRAM_ID and SWAN_PROTOCOL_MODE=rpc"
