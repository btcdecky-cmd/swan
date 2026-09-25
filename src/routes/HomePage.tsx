import { Link } from "react-router-dom";
import { listForZone } from "../lib/campaign-store";
import { getProfile, getOrCreateWallet } from "../lib/session";

export function HomePage() {
  const featured = listForZone("discover").slice(0, 3);
  const profile = getProfile();
  const wallet = getOrCreateWallet();

  return (
    <div>
      <section className="hero">
        <p className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
          Swan · Solana adoption ad protocol
        </p>
        <h1>Discover. Participate. Earn.</h1>
        <p className="muted" style={{ maxWidth: 540 }}>
          Projects fund on-chain escrow. You complete real actions and claim
          rewards when proofs check out. Lending unlocks after your first payout.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <Link className="btn" to="/discover">Browse campaigns</Link>
          <Link className="btn ghost" to="/journey">Start journey</Link>
          <Link className="btn ghost" to="/advertise">Advertise</Link>
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Wallet {wallet.address.slice(0, 4)}…{wallet.address.slice(-4)} · journey
          step {profile.journeyStep}/6
          {profile.hasReceivedPayout ? " · payout unlocked" : ""}
        </p>
      </section>
      <div className="grid cols-2" style={{ marginBottom: 28 }}>
        <div className="card">
          <h3>For users</h3>
          <p className="muted">Discover, complete tasks, claim with Helius proofs.</p>
          <Link to="/journey">Adoption path →</Link>
        </div>
        <div className="card">
          <h3>For projects</h3>
          <p className="muted">Fund campaigns; pay for completions not impressions.</p>
          <Link to="/advertise">Create campaign →</Link>
        </div>
      </div>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Featured campaigns</h2>
      <div className="grid cols-2">
        {featured.map((c) => (
          <Link key={c.id} to={`/campaigns/${c.id}`} className="card">
            <span className={`badge ${c.priority}`}>{c.priority}</span>
            <span className="badge">{c.objective}</span>
            <h3>{c.title}</h3>
            <p className="muted">{c.hook}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
