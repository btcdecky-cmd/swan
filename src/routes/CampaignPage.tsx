import { useParams, Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getCampaign } from "../lib/campaign-store";
import { ensureSimEscrow, submitClaim } from "../lib/protocol";
import { getProtocolMode } from "../lib/protocol/escrow-client";
import { useState } from "react";

const DEMO_WALLET = "DemoUser1111111111111111111111111111111111";

export function CampaignPage() {
  const { id } = useParams();
  const { publicKey, connected } = useWallet();
  const participant = publicKey?.toBase58() ?? DEMO_WALLET;
  const mode = getProtocolMode();
  const campaign = id ? getCampaign(id) : undefined;
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!campaign) {
    return (
      <div>
        <p className="muted">Campaign not found.</p>
        <Link to="/discover">Back to discover</Link>
      </div>
    );
  }

  async function onClaim(taskId: string) {
    if (!campaign) return;
    setBusy(true);
    setMsg("");
    try {
      ensureSimEscrow(campaign.id);
      const task = campaign.tasks.find((t) => t.id === taskId);
      const needsProof =
        task && ["onchain", "stake", "swap"].includes(task.type);
      const result = await submitClaim({
        campaignId: campaign.id,
        taskId,
        participant,
        proofSignature: needsProof ? undefined : undefined,
      });
      setMsg(
        result.ok
          ? `Claimed ${(result.payoutLamports ?? 0) / 1e9} SOL (${result.mode})`
          : `Failed: ${result.reason}`,
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "claim_error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link to="/discover" className="muted">← Discover</Link>
      <h1 style={{ fontSize: 28 }}>{campaign.title}</h1>
      <p className="muted">{campaign.hook}</p>
      <p>
        <span className={`badge ${campaign.priority}`}>{campaign.priority}</span>
        <span className="badge">{campaign.status}</span>
      </p>
      <div style={{ margin: "16px 0" }}>
        <WalletMultiButton />
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Claiming as {participant.slice(0, 8)}… · mode {mode}
          {!connected && " (connect wallet for real pubkey)"}
        </p>
      </div>
      <h2 style={{ fontSize: 20 }}>Tasks</h2>
      {campaign.tasks.map((t) => (
        <div key={t.id} className="card">
          <span className="badge">{t.type}</span>
          <h3>{t.title}</h3>
          <p className="muted">{t.description}</p>
          <p className="muted">{(t.rewardLamports / 1e9).toFixed(4)} SOL</p>
          <button
            className="btn"
            type="button"
            disabled={busy || campaign.status !== "active"}
            onClick={() => onClaim(t.id)}
          >
            Claim reward
          </button>
        </div>
      ))}
      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}
