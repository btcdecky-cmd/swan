import { Link } from "react-router-dom";
import { useState } from "react";
import { supabaseConfigured } from "../lib/supabase";
import {
  getOrCreateWallet,
  setWalletLinked,
  getProfile,
  listActivity,
} from "../lib/session";

export function WalletPage() {
  const [wallet, setWallet] = useState(getOrCreateWallet());
  const profile = getProfile();
  const activity = listActivity();

  function connect() {
    setWalletLinked(true);
    setWallet(getOrCreateWallet());
  }

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Wallet</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        Protocol wallet for rewards and activity. Auth:{" "}
        {supabaseConfigured ? "Supabase configured" : "demo mode"}. On-chain via{" "}
        <Link to="/helius">Helius</Link>.
      </p>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Address</h3>
        <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, wordBreak: "break-all" }}>
          {wallet.address}
        </p>
        <p className="muted">
          Linked: {wallet.linked ? "yes" : "no"} · earned{" "}
          {(profile.totalEarnedLamports / 1e9).toFixed(4)} SOL (session)
        </p>
        <button className="btn" type="button" onClick={connect} style={{ marginTop: 8 }}>
          {wallet.linked ? "Reconnect (demo)" : "Connect wallet (demo)"}
        </button>
      </div>
      <div className="card">
        <h3>Profile</h3>
        <p><strong>{profile.displayName}</strong></p>
        <p className="muted">
          Journey step {profile.journeyStep}/6 · lending{" "}
          {profile.hasReceivedPayout ? "unlocked" : "locked"}
        </p>
        <Link to="/journey">Open journey →</Link>
      </div>
      <div className="card">
        <h3>Activity</h3>
        {activity.length === 0 && (
          <p className="muted">No activity yet — claim a campaign reward.</p>
        )}
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {activity.slice(0, 15).map((a) => (
            <li key={a.id} className="muted" style={{ marginBottom: 6 }}>
              <code>{a.type}</code> · {a.label}
              <br />
              <span style={{ fontSize: 11 }}>{new Date(a.at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
