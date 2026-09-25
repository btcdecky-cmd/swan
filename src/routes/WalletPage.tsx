import { Link } from "react-router-dom";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { supabaseConfigured } from "../lib/supabase";
import { getProfile, listActivity, getOrCreateWallet } from "../lib/session";
import { getClusterLabel, getRpcEndpoint } from "../lib/solana/connection";
import { getProtocolMode, getProgramId } from "../lib/protocol/escrow-client";
import { isPlaceholderProgram } from "../lib/protocol/rpc-escrow";

export function WalletPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const profile = getProfile();
  const activity = listActivity();
  const demo = getOrCreateWallet();
  const mode = getProtocolMode();

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    connection
      .getBalance(publicKey)
      .then((lamports) => setBalance(lamports / 1e9))
      .catch(() => setBalance(null));
  }, [publicKey, connection]);

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Wallet</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        Real wallet adapter. Cluster <strong>{getClusterLabel()}</strong> · mode{" "}
        <code>{mode}</code>.
      </p>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Connect</h3>
        <WalletMultiButton />
        {connected && publicKey && (
          <>
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, wordBreak: "break-all", marginTop: 12 }}>
              {publicKey.toBase58()}
            </p>
            <p className="muted">
              Balance: {balance == null ? "…" : `${balance.toFixed(4)} SOL`}
            </p>
          </>
        )}
        {!connected && (
          <p className="muted" style={{ marginTop: 12 }}>
            Demo fallback: {demo.address.slice(0, 12)}…
          </p>
        )}
      </div>
      <div className="card">
        <h3>Protocol</h3>
        <p className="muted">
          Mode <code>{mode}</code> · program <code>{getProgramId().slice(0, 16)}…</code>
        </p>
        <p className="muted">RPC: {getRpcEndpoint().slice(0, 48)}…</p>
        {isPlaceholderProgram() && (
          <p className="muted">
            Deploy with <code>npm run deploy:escrow</code>, set VITE_SWAN_PROGRAM_ID and
            VITE_SWAN_PROTOCOL_MODE=rpc.
          </p>
        )}
      </div>
      <div className="card">
        <h3>Profile</h3>
        <p><strong>{profile.displayName}</strong></p>
        <p className="muted">
          Journey {profile.journeyStep}/6 · earned{" "}
          {(profile.totalEarnedLamports / 1e9).toFixed(4)} SOL
        </p>
      </div>
      <div className="card">
        <h3>Activity</h3>
        <ul style={{ paddingLeft: 18 }}>
          {activity.slice(0, 12).map((a) => (
            <li key={a.id} className="muted">{a.label}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
