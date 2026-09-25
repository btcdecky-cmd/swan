import type { Campaign } from "../db/schema/campaigns";

export function AdvertiseSummaryCard(props: {
  campaign: Campaign;
  onSubmitReview: () => void;
  onFundActivate: () => void;
}) {
  const { campaign: c, onSubmitReview, onFundActivate } = props;
  return (
    <div className="card">
      <h3>Pre-fund summary</h3>
      <p><strong>{c.title}</strong></p>
      <p className="muted">{c.hook}</p>
      <p className="muted">
        Budget {(c.budgetLamports / 1e9).toFixed(4)} SOL · reward{" "}
        {(c.rewardPerCompletionLamports / 1e9).toFixed(4)} SOL · status {c.status}
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {c.status === "draft" && (
          <button className="btn ghost" type="button" onClick={onSubmitReview}>
            Submit for review
          </button>
        )}
        {(c.status === "draft" || c.status === "pending_review") && (
          <button className="btn" type="button" onClick={onFundActivate}>
            Fund & activate
          </button>
        )}
      </div>
    </div>
  );
}
