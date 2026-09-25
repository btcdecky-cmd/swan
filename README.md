# Swan

**On-chain Solana adoption, advertising, and lending.**

Discover projects → complete real actions → earn rewards from escrow → unlock lending.

Live product loop: **Discover → Participate → Earn**. Lending markets stay locked until a campaign has paid you (journey step 6).

Repository: [github.com/btcdecky-cmd/swan](https://github.com/btcdecky-cmd/swan)

**Website (after deploy):** connect this repo to [Vercel](https://vercel.com) → production URL will look like `https://swan.vercel.app`.

---

## Live protocol

Swan is structured as a **live Solana adoption ad protocol**:

1. Advertiser funds **campaign escrow** (program + sim ledger)
2. Delivery engine selects campaigns by zone / priority / weight
3. User completes task → submits claim (**Helius-enforced proof only** for on-chain / stake / swap — no demo bypass)
4. **One claim per wallet per campaign** (ClaimReceipt)
5. Reward paid from escrow; stats update

| Layer | Location |
|-------|----------|
| Escrow program | `programs/campaign-escrow` |
| Client + claims | `src/lib/protocol/` |
| SQL | `src/db/migrations/001_protocol.sql` |
| Ops UI | `/protocol`, `/inventory` |

```bash
git clone https://github.com/btcdecky-cmd/swan.git
cd swan
cp .env.example .env
# Set HELIUS_API_KEY (required for on-chain task claims)
npm install
npm run dev
```

---

## Campaign model

### Status lifecycle

```
draft → pending_review → active → paused → ended
```

### Zones

`discover` · `journey` · `project` · `lend_teaser`

### Priority (fill order)

| Priority | Role |
|----------|------|
| `override` | Onboarding / protocol-critical |
| `contract` | Paid escrow |
| `remnant` | Organic fill |

### Delivery engine

Revive Adserver concepts (not installed): zones, weight lottery, request / blank / impression / completion stats. Creatives are on-chain **tasks**, not banners.

### Integrations

- **Helius** — RPC, DAS, tx proof for claims
- **Bags.fm** — pools / launches client

---

## Stack

Vite + React + TypeScript · Anchor-style Solana programs · Supabase-ready SQL · Helius · Bags.fm
