import { Link } from "react-router-dom";
import { listForZone } from "../lib/campaign-store";
import { getProfile } from "../lib/session";

export function LendPage() {
  const profile = getProfile();
  const unlocked = profile.hasReceivedPayout || profile.journeyStep >= 6;
  const teasers = listForZone("lend_teaser");

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Lend</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        Markets open after at least one campaign payout. Target LTV 50%.
      </p>
      {!unlocked ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Locked</h3>
          <p className="muted">Complete a paid campaign and claim a reward first.</p>
          <Link className="btn" to="/discover" style={{ marginTop: 8, display: "inline-block" }}>
            Find a campaign
          </Link>
        </div>
      ) : (
        <div className="grid cols-2" style={{ marginTop: 16 }}>
          <div className="card">
            <h3>SOL market</h3>
            <p className="muted">Supply APY (demo) 4.2% · Borrow 7.1%</p>
            <button className="btn" type="button" disabled>Supply (devnet soon)</button>
          </div>
          <div className="card">
            <h3>USDC market</h3>
            <p className="muted">Supply APY (demo) 5.0% · Borrow 8.4%</p>
            <button className="btn" type="button" disabled>Supply (devnet soon)</button>
          </div>
        </div>
      )}
      {teasers.map((c) => (
        <Link key={c.id} to={`/campaigns/${c.id}`} className="card" style={{ display: "block" }}>
          <span className={`badge ${c.priority}`}>{c.priority}</span>
          <h3>{c.title}</h3>
          <p className="muted">{c.hook}</p>
        </Link>
      ))}
    </div>
  );
}
