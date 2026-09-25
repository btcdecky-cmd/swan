# Swan

**On-chain Solana adoption, advertising, and lending.**

> Discover → Participate → Earn → (later) Lend

**Repo:** [github.com/btcdecky-cmd/swan](https://github.com/btcdecky-cmd/swan)

## Quick start

```bash
git clone https://github.com/btcdecky-cmd/swan.git && cd swan
cp .env.example .env && npm install && npm run dev
```

## Production deploy (Vercel)

1. Import **btcdecky-cmd/swan** at [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Vite** · Build: `npm run build` · Output: `dist`
3. Env from `.env.example` — at least `VITE_HELIUS_API_KEY`, `VITE_SWAN_PROTOCOL_MODE`
4. SPA rewrites: `vercel.json`
5. Optional: `bash scripts/setup-solana.sh` + `npm run deploy:escrow` then set `VITE_SWAN_PROGRAM_ID` + `rpc` mode

## V1 routes

`/` · `/discover` · `/campaigns/:id` · `/journey` · `/wallet` · `/advertise` · `/inventory` · `/protocol` · `/lend` · `/tokens` · `/bags` · `/helius`

## Modes

| `sim` | In-memory escrow (default) |
| `rpc` | After Anchor deploy + program id |

## Stack

Vite · React 19 · TypeScript · wallet-adapter · web3.js · Helius · Bags · Anchor escrow

## License

Proprietary unless otherwise stated.
