/**
 * Swan session — wallet + profile + activity.
 * create-solana-dapp style local state; plug wallet-adapter later.
 */

export interface SwanProfile {
  displayName: string;
  bio?: string;
  createdAt: string;
  journeyStep: number;
  hasReceivedPayout: boolean;
  totalEarnedLamports: number;
}

export interface ActivityItem {
  id: string;
  type: "claim" | "journey" | "wallet" | "campaign_view";
  label: string;
  at: string;
  meta?: Record<string, string>;
}

const PROFILE_KEY = "swan_profile_v1";
const WALLET_KEY = "swan_wallet_v1";
const ACTIVITY_KEY = "swan_activity_v1";

function demoPubkey(seed: string): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  let out = "";
  for (let i = 0; i < 44; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    out += alphabet[h % alphabet.length];
  }
  return out;
}

export function getOrCreateWallet(): { address: string; linked: boolean } {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw) return JSON.parse(raw) as { address: string; linked: boolean };
  } catch {}
  const w = { address: demoPubkey("swan-demo-user"), linked: false };
  try {
    localStorage.setItem(WALLET_KEY, JSON.stringify(w));
  } catch {}
  return w;
}

export function setWalletLinked(linked: boolean): void {
  const w = getOrCreateWallet();
  w.linked = linked;
  try {
    localStorage.setItem(WALLET_KEY, JSON.stringify(w));
  } catch {}
}

export function getProfile(): SwanProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as SwanProfile;
  } catch {}
  return {
    displayName: "Swan explorer",
    createdAt: new Date().toISOString(),
    journeyStep: 0,
    hasReceivedPayout: false,
    totalEarnedLamports: 0,
  };
}

export function saveProfile(p: SwanProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {}
}

export function setJourneyStep(step: number): SwanProfile {
  const p = getProfile();
  p.journeyStep = Math.max(p.journeyStep, Math.min(6, step));
  saveProfile(p);
  return p;
}

export function recordPayout(lamports: number): SwanProfile {
  const p = getProfile();
  p.hasReceivedPayout = true;
  p.totalEarnedLamports += lamports;
  p.journeyStep = Math.max(p.journeyStep, 5);
  saveProfile(p);
  pushActivity({
    id: `act_${Date.now()}`,
    type: "claim",
    label: `Earned ${(lamports / 1e9).toFixed(4)} SOL from campaign`,
    at: new Date().toISOString(),
  });
  return p;
}

export function pushActivity(item: ActivityItem): void {
  const list = listActivity();
  list.unshift(item);
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {}
}

export function listActivity(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw) return JSON.parse(raw) as ActivityItem[];
  } catch {}
  return [];
}

export const JOURNEY_STEPS = [
  { id: 0, title: "Connect wallet", hint: "Link or use protocol wallet" },
  { id: 1, title: "Learn about Solana", hint: "Complete a short orientation" },
  { id: 2, title: "First on-chain action", hint: "Any confirmed tx (Helius)" },
  { id: 3, title: "Discover a project", hint: "Open a campaign on Discover" },
  { id: 4, title: "Complete eligible activity", hint: "Finish a campaign task" },
  { id: 5, title: "Receive reward", hint: "Successful claim from escrow" },
  { id: 6, title: "Unlock lending", hint: "Markets open after first payout" },
] as const;
