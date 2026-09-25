import type { Campaign, CampaignStatus, CampaignZone } from "../db/schema/campaigns";
import { canTransition, sortCampaignsByPriority } from "../db/schema/campaigns";

export function campaignsForZone(list: Campaign[], zone: CampaignZone): Campaign[] {
  return list
    .filter((c) => c.status === "active" && c.zones.includes(zone))
    .sort(sortCampaignsByPriority);
}

export function transitionCampaign(c: Campaign, to: CampaignStatus): Campaign {
  if (!canTransition(c.status, to)) {
    throw new Error(`invalid_transition:${c.status}->${to}`);
  }
  return { ...c, status: to, updatedAt: new Date().toISOString() };
}

export function remainingBudget(c: Campaign): number {
  return Math.max(0, c.budgetLamports - c.spentLamports);
}
