/**
 * Token aggregator — clean-room adaptation of solana-labs/token-aggregator.
 * Does NOT install that package. Merges Jupiter strict list + seed.
 */

import { type TokenInfo, type TokenList, WELL_KNOWN_MINTS } from "./types";

const JUPITER_STRICT = "https://token.jup.ag/strict";

const SEED_TOKENS: TokenInfo[] = [
  { chainId: 101, address: WELL_KNOWN_MINTS.SOL, symbol: "SOL", name: "Wrapped SOL", decimals: 9, tags: ["wrapped-solana"] },
  { chainId: 101, address: WELL_KNOWN_MINTS.USDC, symbol: "USDC", name: "USD Coin", decimals: 6, tags: ["stablecoin"] },
  { chainId: 101, address: WELL_KNOWN_MINTS.USDT, symbol: "USDT", name: "Tether USD", decimals: 6, tags: ["stablecoin"] },
  { chainId: 101, address: WELL_KNOWN_MINTS.JUP, symbol: "JUP", name: "Jupiter", decimals: 6, tags: ["defi"] },
  { chainId: 101, address: WELL_KNOWN_MINTS.JitoSOL, symbol: "JitoSOL", name: "Jito Staked SOL", decimals: 9, tags: ["lst", "stake"] },
];

let cache: {
  byMint: Map<string, TokenInfo>;
  bySymbol: Map<string, TokenInfo[]>;
  list: TokenList;
  fetchedAt: number;
} | null = null;

const CACHE_MS = 30 * 60 * 1000;

function indexTokens(tokens: TokenInfo[]) {
  const byMint = new Map<string, TokenInfo>();
  const bySymbol = new Map<string, TokenInfo[]>();
  for (const t of tokens) {
    byMint.set(t.address, t);
    const sym = t.symbol.toUpperCase();
    const arr = bySymbol.get(sym) ?? [];
    arr.push(t);
    bySymbol.set(sym, arr);
  }
  return { byMint, bySymbol };
}

export async function aggregateTokenList(force = false): Promise<TokenList> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.list;
  }
  let remote: TokenInfo[] = [];
  try {
    const res = await fetch(JUPITER_STRICT, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = (await res.json()) as TokenInfo[] | { tokens?: TokenInfo[] };
      remote = Array.isArray(data) ? data : (data.tokens ?? []);
    }
  } catch { /* offline */ }
  const seen = new Set<string>();
  const merged: TokenInfo[] = [];
  for (const t of [...SEED_TOKENS, ...remote]) {
    if (!t?.address || seen.has(t.address)) continue;
    seen.add(t.address);
    merged.push({
      chainId: t.chainId ?? 101,
      address: t.address,
      symbol: t.symbol ?? "???",
      name: t.name ?? t.symbol ?? "Unknown",
      decimals: t.decimals ?? 9,
      logoURI: t.logoURI,
      tags: t.tags,
      extensions: t.extensions,
    });
  }
  const list: TokenList = {
    name: remote.length ? "Swan aggregated (Jupiter strict + seed)" : "Swan seed",
    keywords: ["swan", "solana", "aggregator"],
    timestamp: new Date().toISOString(),
    tokens: merged,
  };
  const { byMint, bySymbol } = indexTokens(merged);
  cache = { byMint, bySymbol, list, fetchedAt: Date.now() };
  return list;
}

export async function getTokenByMint(mint: string): Promise<TokenInfo | undefined> {
  await aggregateTokenList();
  return cache?.byMint.get(mint);
}

export async function getTokensBySymbol(symbol: string): Promise<TokenInfo[]> {
  await aggregateTokenList();
  return cache?.bySymbol.get(symbol.toUpperCase()) ?? [];
}

export function getSeedTokens(): TokenInfo[] {
  return [...SEED_TOKENS];
}

export function resolveMintHint(hint: string): string | undefined {
  const h = hint.trim();
  if (h.length >= 32 && h.length <= 44) return h;
  const upper = h.toUpperCase();
  if (upper in WELL_KNOWN_MINTS) {
    return WELL_KNOWN_MINTS[upper as keyof typeof WELL_KNOWN_MINTS];
  }
  return undefined;
}

export function aggregateOffline(): TokenList {
  const list: TokenList = {
    name: "Swan seed token list",
    keywords: ["swan", "solana"],
    timestamp: new Date().toISOString(),
    tokens: SEED_TOKENS,
  };
  const { byMint, bySymbol } = indexTokens(list.tokens);
  cache = { byMint, bySymbol, list, fetchedAt: Date.now() };
  return list;
}
