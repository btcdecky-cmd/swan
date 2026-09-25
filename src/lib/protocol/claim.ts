/**
 * Claim pipeline — fund sim escrow if needed, Helius for on-chain tasks,
 * pay from escrow, record session payout.
 */

import {
  claimCompletion,
  fundCampaignSim,
  getEscrowState,
  getProtocolMode,
  type ClaimResult,
} from "./escrow-client";
import { recordPayout, setJourneyStep } from "../session";
import { getCampaign } from "../campaign-store";
import { recordCompletion, applyCompletionToCampaign } from "../inventory-store";

export function ensureSimEscrow(campaignId: string): void {
  if (getEscrowState(campaignId)) return;
  const c = getCampaign(campaignId);
  if (!c) return;
  fundCampaignSim({
    campaignId: c.id,
    advertiser: c.advertiserWallet ?? "Advertiser1111111111111111111111111111111",
    authority: "SwanOracle1111111111111111111111111111111",
    budgetLamports: c.budgetLamports,
    rewardPerCompletionLamports: c.rewardPerCompletionLamports,
    maxCompletions: c.maxCompletions ?? 10_000,
  });
}

export async function submitClaim(args: {
  campaignId: string;
  taskId: string;
  participant: string;
  proofSignature?: string;
  zoneKey?: string;
}): Promise<ClaimResult & { taskType?: string }> {
  const mode = getProtocolMode();
  const c = getCampaign(args.campaignId);
  if (!c) return { ok: false, reason: "campaign_not_found", mode };
  if (c.status !== "active") return { ok: false, reason: "campaign_not_active", mode };

  const task = c.tasks?.find((t) => t.id === args.taskId);
  if (!task) return { ok: false, reason: "task_not_found", mode };

  ensureSimEscrow(c.id);

  const result = await claimCompletion({
    campaignId: c.id,
    participant: args.participant,
    proofSignature: args.proofSignature,
    taskType: task.type,
    rewardLamports: task.rewardLamports ?? c.rewardPerCompletionLamports,
  });

  if (result.ok) {
    const zoneKey = args.zoneKey ?? c.zones?.[0] ?? "discover";
    try {
      recordCompletion(c.id, zoneKey, task.id, args.participant);
    } catch {}
    try {
      applyCompletionToCampaign(
        c.id,
        task.rewardLamports ?? c.rewardPerCompletionLamports,
      );
    } catch {}
    recordPayout(task.rewardLamports ?? c.rewardPerCompletionLamports);
    setJourneyStep(5);
  }

  return { ...result, taskType: task.type };
}
