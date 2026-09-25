# Swan

**On-chain Solana adoption, advertising, and lending.**

> Discover → Participate → Earn → (later) Lend

Swan is a Solana-native **adoption ad protocol**. Projects fund escrow campaigns. Users complete real actions. Delivery ranks inventory by zone · priority · weight. On-chain tasks pay only after **Helius** verifies the tx. Lending unlocks after a proven payout.

**Repo:** [github.com/btcdecky-cmd/swan](https://github.com/btcdecky-cmd/swan)

---

## Quick start

```bash
git clone https://github.com/btcdecky-cmd/swan.git
cd swan
cp .env.example .env
npm install
npm run dev          # http://localhost:3000
```

For Solana CLI + keypair + Anchor (on your machine):

```bash
bash scripts/setup-solana.sh
# Fund via https://faucet.solana.com if airdrop rate-limits
npm run deploy:escrow
# then set VITE_SWAN_PROGRAM_ID + VITE_SWAN_PROTOCOL_MODE=rpc
```

---

## V1 surface

| Path | Feature |
|------|---------|
| `/` | Home · featured campaigns |
| `/discover` | Active campaigns by zone |
| `/campaigns/:id` | Tasks · claim (wallet pubkey) |
| `/journey` | 7-step adoption path |
| `/wallet` | Wallet adapter (Phantom/Solflare) · balance · activity |
| `/advertise` | Draft → review → fund & activate |
| `/inventory` | Zone invoke · delivery stats |
| `/protocol` | Mode · escrow ledger · checklist |
| `/lend` | Gated on first payout |
| `/tokens` | Token aggregator + agent action catalog |
| `/bags` | Bags.fm client |
| `/helius` | RPC / proof tools |

---

## Protocol modes

| Mode | Behavior |
|------|----------|
| `sim` (default) | In-memory escrow ledger |
| `rpc` | Wallet-signed claims after program deploy |

```bash
SWAN_PROTOCOL_MODE=sim
VITE_SWAN_PROTOCOL_MODE=sim
# After deploy:
# SWAN_PROTOCOL_MODE=rpc
# VITE_SWAN_PROGRAM_ID=<program_id>
```

---

## Stack

- **App:** Vite · React 19 · TypeScript · React Router
- **Wallet:** `@solana/wallet-adapter-*` (Phantom, Solflare)
- **Chain:** `@solana/web3.js` · Anchor `campaign-escrow`
- **Proofs:** Helius (required for onchain/stake/swap)
- **Optional:** Bags.fm · Supabase

---

## Campaign model

```
draft → pending_review → active → paused → ended
```

**Zones:** `discover` · `journey` · `project` · `lend_teaser`  
**Priority:** `override` → `contract` → `remnant`  
**Tasks:** visit · quiz · social · onchain · stake · swap  

Helius-enforced proofs for **onchain / stake / swap** — no demo bypass.

---

## Programs

```
programs/campaign-escrow   # initialize · pay_completion · ClaimReceipt
programs/lending           # post-adoption markets (sketch)
```

```bash
npm run deploy:escrow
```

---

## Integrations (patterns only — not installed)

| Reference | Swan code |
|-----------|-----------|
| solana-labs/token-aggregator | `src/lib/tokens/` |
| sendaifun/solana-agent-kit | `src/lib/agent/` |
| create-solana-dapp / SDP | layout · session · Anchor.toml |

---

## Environment

See `.env.example`: Helius keys, protocol mode, program id, RPC URL, Bags/Supabase optional.

---

## Go-live

1. `bash scripts/setup-solana.sh` + [faucet.solana.com](https://faucet.solana.com)
2. `npm run deploy:escrow`
3. Set program id + `rpc` mode
4. Connect Phantom (Devnet) on `/wallet`
5. Fund campaign · claim
6. Deploy frontend (Vercel)

---

## License

Proprietary unless otherwise stated.
