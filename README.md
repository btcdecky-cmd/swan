# Swan

**On-chain Solana adoption, advertising, and lending.**

> Discover → Participate → Earn → (later) Lend

Swan is a **Solana-native adoption ad protocol**. Projects fund escrow campaigns. Users complete **real actions** (visit, learn, on-chain). Delivery ranks inventory by **zone · priority · weight**. On-chain tasks pay **only after Helius verifies** a successful transaction. Lending unlocks after proven usage—not empty impressions.

**Primary repository:** [github.com/btcdecky-cmd/swan](https://github.com/btcdecky-cmd/swan)

---

## Table of contents

1. [Why Swan](#why-swan)
2. [Product loop](#product-loop)
3. [Quick start](#quick-start)
4. [Environment](#environment)
5. [Architecture](#architecture)
6. [Campaign model](#campaign-model)
7. [Delivery engine](#delivery-engine)
8. [Protocol & escrow](#protocol--escrow)
9. [Helius-enforced proofs](#helius-enforced-proofs)
10. [Integrations](#integrations)
11. [App routes](#app-routes)
12. [Solana programs](#solana-programs)
13. [Database](#database)
14. [Scripts](#scripts)
15. [Go-live checklist](#go-live-checklist)
16. [Stack](#stack)
17. [License](#license)

---

## Why Swan

Most Web3 growth tools optimize for **quest volume**. Advertisers care about **users who actually use the protocol**.

Swan treats adoption like inventory:

| Classic ad server | Swan |
|-------------------|------|
| Zone | App surface (`discover`, `journey`, …) |
| Banner | **Task** (action, not a pixel) |
| Contract / override / remnant | Campaign **priority** |
| Impression → conversion | **Request → impression → completion** |
| Creative weight | Campaign / task **weight** |
| Off-chain escrow | **On-chain campaign escrow** |

Concepts are inspired by mature open-source ad servers (e.g. Revive Adserver). **Nothing from those projects is installed**—Swan is a clean Solana product.

---

## Product loop

```
NEW USER
   ↓
Connect wallet
   ↓
Learn about Solana (journey)
   ↓
First on-chain action
   ↓
Discover a Solana project (campaign)
   ↓
Complete eligible task
   ↓
Claim reward (Helius proof for on-chain tasks)
   ↓
Return for more · unlock lending after payout proof
```

**Advertiser path**

```
Draft campaign → pending_review → Fund & activate → active
   → users claim from escrow → pause / end & refund
```

---

## Quick start

```bash
git clone https://github.com/btcdecky-cmd/swan.git
cd swan
cp .env.example .env
# Edit .env — at minimum set HELIUS_API_KEY for on-chain claims
npm install
npm run dev          # http://localhost:3000
```

Demo mode works with placeholders for Supabase/Bags. **On-chain / stake / swap claims require a real Helius API key.**

```bash
npm run helius:ping
npm run bags:ping
```

---

## Environment

Copy `.env.example` → `.env`:

| Variable | Purpose |
|----------|---------|
| `HELIUS_API_KEY` / `VITE_HELIUS_API_KEY` | **Required** for on-chain task payouts |
| `HELIUS_NETWORK` | `mainnet` or `devnet` |
| `SOLANA_RPC_URL` | Prefer Helius RPC URL |
| `SWAN_PROTOCOL_MODE` | `sim` (default) or `rpc` |
| `BAGS_API_KEY` | Bags.fm public API |
| `DATABASE_URL` / `SUPABASE_*` | Postgres + auth when leaving in-memory store |
| `APP_URL` / `VITE_APP_URL` | App origin |

Get a Helius key: [dashboard.helius.dev](https://dashboard.helius.dev)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Vite + React + TypeScript (SPA)                            │
│  Discover · Journey · Advertise · Inventory · Protocol …    │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌─────────────────┐
│ Delivery      │  │ Protocol layer │  │ Helius client   │
│ zones/weight  │  │ escrow + claim │  │ proof + RPC/DAS │
└───────────────┘  └────────┬───────┘  └─────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │ programs/campaign-escrow │
              │ (Anchor-style, ClaimReceipt)
              └──────────────────────────┘
```

| Layer | Path |
|-------|------|
| UI routes | `src/routes/` |
| Campaign domain | `src/db/schema/campaigns.ts` |
| Zones / inventory | `src/db/schema/zones.ts`, `inventory.ts` |
| Delivery engine | `src/lib/delivery.ts` |
| Escrow + claims | `src/lib/protocol/` |
| Helius | `src/lib/helius/` |
| Bags | `src/lib/bags/` |
| SQL migration | `src/db/migrations/001_protocol.sql` |
| Programs | `programs/campaign-escrow`, `programs/lending` |

---

## Campaign model

### Status lifecycle

```
draft → pending_review → active → paused → ended
```

- **draft** — editable, unfunded
- **pending_review** — pre-fund summary; explicit **Fund & activate**
- **active** — in delivery + claimable
- **paused** / **ended** — stop delivery; end can refund remainder

### Zones

| Zone | Surface |
|------|---------|
| `discover` | Main marketplace feed |
| `journey` | Onboarding steps |
| `project` | Project detail |
| `lend_teaser` | Lending unlock teaser |

### Priority (fill order)

| Priority | Role |
|----------|------|
| `override` | Onboarding / protocol-critical |
| `contract` | Paid escrow (default for advertisers) |
| `remnant` | Organic / residual fill |

### Weight

Relative selection **within the same priority tier** (higher → more likely). Optional weight on tasks.

### Objectives

`discovery` · `education` · `activation` · `retention` · `liquidity`

### Task types

| Type | Proof |
|------|--------|
| `visit` · `quiz` · `social` | App / off-chain rules |
| `onchain` · `stake` · `swap` | **Helius-enforced** tx signature |

---

## Delivery engine

1. Filter **active** campaigns linked to the zone with remaining budget
2. Walk tiers: **override → contract → remnant**
3. **Weighted** pick inside the first non-empty tier
4. Emit events: `request` · `blank` · `impression` · `completion`

```text
src/lib/delivery.ts          — selectForZone()
src/lib/inventory-store.ts   — invokeZone()
```

Ops UI: **`/inventory`**

---

## Protocol & escrow

### Modes

| Mode | Behavior |
|------|----------|
| `sim` (default) | In-process escrow ledger |
| `rpc` | Real on-chain instructions + oracle signer |

### Claim rules

1. Campaign **active** and escrow funded
2. Budget and max completions not exhausted
3. **One claim per wallet per campaign** (ClaimReceipt)
4. For `onchain` / `stake` / `swap`: Helius must confirm the signature

```text
src/lib/protocol/claim.ts
src/lib/protocol/escrow-client.ts
```

### Advertise flow

Draft → review summary → **Fund & activate** → escrow funded + `active`

Ops UI: **`/protocol`**

---

## Helius-enforced proofs

For **on-chain · stake · swap**, payout requires all of:

| Check | Failure reason |
|-------|----------------|
| Missing / short signature | `proof_signature_required` |
| Demo / placeholder pattern | `demo_signature_rejected` |
| No real API key | `helius_not_configured` |
| Tx not confirmed or failed | `signature_not_confirmed_or_failed` |
| Wallet not in tx (when checked) | `wallet_not_in_transaction` |

**No demo bypass.**

```text
src/lib/helius/verify-task.ts
```

Also: RPC, DAS assets, tx history, priority fees.

SDK: [helius-labs/helius-sdk](https://github.com/helius-labs/helius-sdk)

---

## Integrations

### Helius

Signature verification for claims · balance / slot · DAS portfolio · activity history

### Bags.fm

Pools / launch feed client · `src/lib/bags/` · UI `/bags`

---

## App routes

| Path | Purpose |
|------|---------|
| `/` | Home |
| `/discover` | Ranked active campaigns |
| `/campaigns/:id` | Tasks + Claim reward |
| `/journey` | Adoption journey |
| `/wallet` | Wallet / activity |
| `/advertise` | Draft → review → fund |
| `/inventory` | Zones, delivery, stats |
| `/protocol` | Escrow mode, ledger, checklist |
| `/lend` | Lending teaser (gated) |
| `/bags` | Bags.fm |
| `/helius` | Helius tools |

---

## Solana programs

### `programs/campaign-escrow`

- `initialize_campaign` — fund escrow PDA
- `pay_completion` — pay participant; **ClaimReceipt** blocks double-pay
- `pause` / `end_and_refund`

Program id (until deploy):

```text
SwanCmpEscrow1111111111111111111111111
```

### `programs/lending`

Sketch for post-adoption lending (unlock after proven usage).

```bash
anchor build
anchor deploy --provider.cluster devnet
# then SWAN_PROTOCOL_MODE=rpc + oracle keypair
```

---

## Database

In-memory stores for local demo. Production:

```bash
psql "$DATABASE_URL" -f src/db/migrations/001_protocol.sql
```

Includes `campaigns`, `claims` (unique campaign + participant), `delivery_events`.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run helius:ping` | Helius connectivity |
| `npm run bags:ping` | Bags API connectivity |
| `npm run db:seed` | Seed campaigns (when DB wired) |

**Node:** ≥ 20

---

## Go-live checklist

1. [ ] Helius project → set `HELIUS_API_KEY`
2. [ ] (Optional) Supabase → `DATABASE_URL` + SQL migration
3. [ ] (Optional) Bags key from [dev.bags.fm](https://dev.bags.fm)
4. [ ] `anchor build && anchor deploy` campaign escrow (devnet)
5. [ ] `SWAN_PROTOCOL_MODE=rpc` + oracle authority
6. [ ] Real wallet adapter (replace demo wallet)
7. [ ] Pilot one paid campaign with real SOL
8. [ ] Deploy frontend (Vercel) + production env
9. [ ] Put live URL in this README

---

## Stack

| Layer | Choice |
|-------|--------|
| App | Vite 6 · React 19 · TypeScript · React Router |
| Validation | Zod |
| Data | Drizzle-ready · Supabase/Postgres · in-memory demo |
| Chain | Solana · Anchor-style Rust programs |
| Infra APIs | Helius · Bags.fm |

---

## Brand

- **Name:** Swan  
- **Tagline:** Discover. Participate. Earn.  
- **Tone:** Serious Solana infrastructure  

---

## License

Proprietary / all rights reserved unless otherwise stated in this repository.

---

## Related

- Legacy history: [aether-protocol](https://github.com/btcdecky-cmd/aether-protocol)
- Helius SDK: [helius-labs/helius-sdk](https://github.com/helius-labs/helius-sdk)
- Bags: [dev.bags.fm](https://dev.bags.fm)
