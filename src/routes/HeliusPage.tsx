import { getClusterLabel, getRpcEndpoint } from "../lib/solana/connection";

export function HeliusPage() {
  const key =
    (import.meta as { env?: Record<string, string> }).env?.VITE_HELIUS_API_KEY ?? "";
  const ok = key && !key.includes("placeholder") && key.length > 8;
  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Helius</h1>
      <p className="muted">
        On-chain task proofs require a real API key. Cluster {getClusterLabel()}.
      </p>
      <div className="card">
        <h3>Config</h3>
        <p className="muted">Key: {ok ? "configured" : "missing / placeholder"}</p>
        <p className="muted">RPC {getRpcEndpoint().slice(0, 56)}…</p>
      </div>
    </div>
  );
}
