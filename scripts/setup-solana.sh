#!/usr/bin/env bash
# Install Solana CLI + Anchor + generate/fund keypair (run on YOUR machine)
set -euo pipefail

echo "==> Solana CLI"
if ! command -v solana >/dev/null; then
  sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi
solana --version

echo "==> Keypair"
mkdir -p .keys
if [[ ! -f .keys/devnet-id.json ]]; then
  solana-keygen new --no-bip39-passphrase -o .keys/devnet-id.json
fi
PUB=$(solana-keygen pubkey .keys/devnet-id.json)
echo "Pubkey: $PUB"
solana config set --url devnet --keypair .keys/devnet-id.json

echo "==> Airdrop (rate limits common — use https://faucet.solana.com if fails)"
solana airdrop 2 "$PUB" --url devnet || true
solana balance "$PUB" --url devnet

echo "==> Anchor (needs recent Rust: rustup update stable)"
if ! command -v avm >/dev/null; then
  cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 avm --locked --force || true
fi
if command -v avm >/dev/null; then
  avm install 0.30.1
  avm use 0.30.1
  anchor --version
fi

echo "Done. Never commit .keys/ or seed phrases."
