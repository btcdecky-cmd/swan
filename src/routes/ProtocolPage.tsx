import { getProtocolMode, getProgramId, listFundedCampaigns } from "../lib/protocol/escrow-client";
import { isPlaceholderProgram } from "../lib/protocol/rpc-escrow";
import { getClusterLabel, getRpcEndpoint } from "../lib/solana/connection";

export function ProtocolPage() {
  const mode = getProtocolMode();
  const funded = listFundedCampaigns();
  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Protocol</h1>
      <div className="card">
        <h3>Mode</h3>
        <p><code>{mode}</code> · cluster {getClusterLabel()}</p>
        <p className="muted">Program {getProgramId()}</p>
        <p className="muted">RPC {getRpcEndpoint().slice(0, 48)}…</p>
        {isPlaceholderProgram() && (
          <p className="muted">
            Deploy with <code>npm run deploy:escrow</code> then set
            VITE_SWAN_PROGRAM_ID + VITE_SWAN_PROTOCOL_MODE=rpc.
          </p>
        )}
      </div>
      <div className="card">
        <h3>Funded escrow (sim)</h3>
        {funded.length === 0 && <p className="muted">None yet — activate a campaign.</p>}
        {funded.map((f) => (
          <p key={f.campaignId} className="muted">
            {f.campaignId} · spent {f.spentLamports}/{f.budgetLamports} · claims{" "}
            {f.completionCount}
          </p>
        ))}
      </div>
    </div>
  );
}
