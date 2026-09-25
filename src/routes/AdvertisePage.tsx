import { useState } from "react";
import { upsertCampaign } from "../lib/campaign-store";
import { transitionCampaign } from "../lib/campaign-flow";
import { fundCampaignSim } from "../lib/protocol/escrow-client";
import type { Campaign } from "../db/schema/campaigns";
import { AdvertiseSummaryCard } from "../components/AdvertiseSummaryCard";

export function AdvertisePage() {
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [budgetSol, setBudgetSol] = useState("1");
  const [rewardSol, setRewardSol] = useState("0.01");
  const [draft, setDraft] = useState<Campaign | null>(null);
  const [status, setStatus] = useState("");

  function createDraft() {
    const now = new Date().toISOString();
    const id = `cmp_${Date.now()}`;
    const budgetLamports = Math.floor(parseFloat(budgetSol || "0") * 1e9);
    const rewardPerCompletionLamports = Math.floor(
      parseFloat(rewardSol || "0") * 1e9,
    );
    const c: Campaign = {
      id,
      projectId: "prj_custom",
      slug: id,
      title: title || "Untitled campaign",
      hook: hook || "Complete a task. Earn from escrow.",
      description: hook,
      objective: "activation",
      status: "draft",
      priority: "contract",
      zones: ["discover"],
      category: "custom",
      budgetLamports,
      spentLamports: 0,
      rewardPerCompletionLamports,
      maxCompletions: Math.max(1, Math.floor(budgetLamports / Math.max(1, rewardPerCompletionLamports))),
      completionCount: 0,
      tasks: [
        {
          id: `t_${id}`,
          type: "visit",
          title: "Visit project",
          description: "Open the project URL",
          rewardLamports: rewardPerCompletionLamports,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    upsertCampaign(c);
    setDraft(c);
    setStatus("Draft created");
  }

  function submitReview() {
    if (!draft) return;
    const next = transitionCampaign(draft, "pending_review");
    upsertCampaign(next);
    setDraft(next);
    setStatus("Pending review");
  }

  function fundActivate() {
    if (!draft) return;
    fundCampaignSim({
      campaignId: draft.id,
      advertiser: "Advertiser1111111111111111111111111111111",
      authority: "SwanOracle1111111111111111111111111111111",
      budgetLamports: draft.budgetLamports,
      rewardPerCompletionLamports: draft.rewardPerCompletionLamports,
      maxCompletions: draft.maxCompletions,
    });
    let next = draft.status === "draft" ? transitionCampaign(draft, "pending_review") : draft;
    next = transitionCampaign(next, "active");
    upsertCampaign(next);
    setDraft(next);
    setStatus("Funded & active");
  }

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Advertise</h1>
      <p className="muted">Draft → review → fund & activate.</p>
      <div className="card">
        <label className="muted">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <label className="muted">Hook</label>
        <input value={hook} onChange={(e) => setHook(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <label className="muted">Budget (SOL)</label>
        <input value={budgetSol} onChange={(e) => setBudgetSol(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <label className="muted">Reward / completion (SOL)</label>
        <input value={rewardSol} onChange={(e) => setRewardSol(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <button className="btn" type="button" onClick={createDraft}>Create draft</button>
      </div>
      {draft && (
        <AdvertiseSummaryCard
          campaign={draft}
          onSubmitReview={submitReview}
          onFundActivate={fundActivate}
        />
      )}
      {status && <p className="muted">{status}</p>}
    </div>
  );
}
