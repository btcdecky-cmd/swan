import type { Campaign, CampaignZone } from "../db/schema/campaigns";
import { PRIORITY_RANK } from "../db/schema/campaigns";
import type {
  DeliveryContext,
  DeliveryEvent,
  ZoneStats,
  CampaignStats,
} from "../db/schema/inventory";

export interface DeliveryResult {
  campaign: Campaign | null;
  event: DeliveryEvent;
}

function weightedPick(pool: Campaign[]): Campaign | null {
  if (!pool.length) return null;
  const weights = pool.map((c) => Math.max(1, c.weight ?? 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function selectForZone(campaigns: Campaign[], ctx: DeliveryContext): DeliveryResult {
  const zone = ctx.zoneKey as CampaignZone;
  const eligible = campaigns.filter(
    (c) =>
      c.status === "active" &&
      c.zones.includes(zone) &&
      c.spentLamports < c.budgetLamports &&
      c.completionCount < c.maxCompletions,
  );
  const tiers = (["override", "contract", "remnant"] as const).map((p) =>
    eligible.filter((c) => c.priority === p),
  );
  let chosen: Campaign | null = null;
  for (const tier of tiers) {
    chosen = weightedPick(tier);
    if (chosen) break;
  }
  const at = new Date().toISOString();
  if (!chosen) {
    return {
      campaign: null,
      event: {
        id: `evt_${Date.now()}`,
        type: "blank",
        zoneKey: String(ctx.zoneKey),
        at,
      },
    };
  }
  return {
    campaign: chosen,
    event: {
      id: `evt_${Date.now()}`,
      type: "impression",
      zoneKey: String(ctx.zoneKey),
      campaignId: chosen.id,
      wallet: ctx.wallet,
      at,
    },
  };
}

export function rankForZone(campaigns: Campaign[], zone: CampaignZone): Campaign[] {
  return campaigns
    .filter((c) => c.status === "active" && c.zones.includes(zone))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

export function aggregateZoneStats(events: DeliveryEvent[]): ZoneStats[] {
  const map = new Map<string, ZoneStats>();
  for (const e of events) {
    const s = map.get(e.zoneKey) ?? {
      zoneKey: e.zoneKey,
      requests: 0,
      impressions: 0,
      blanks: 0,
      completions: 0,
    };
    if (e.type === "request") s.requests++;
    if (e.type === "impression") s.impressions++;
    if (e.type === "blank") s.blanks++;
    if (e.type === "completion") s.completions++;
    map.set(e.zoneKey, s);
  }
  return [...map.values()];
}

export function aggregateCampaignStats(events: DeliveryEvent[]): CampaignStats[] {
  const map = new Map<string, CampaignStats>();
  for (const e of events) {
    if (!e.campaignId) continue;
    const s = map.get(e.campaignId) ?? {
      campaignId: e.campaignId,
      impressions: 0,
      completions: 0,
    };
    if (e.type === "impression") s.impressions++;
    if (e.type === "completion") s.completions++;
    map.set(e.campaignId, s);
  }
  return [...map.values()];
}
