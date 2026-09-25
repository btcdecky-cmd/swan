import { Link } from "react-router-dom";
import { useState } from "react";
import { listForZone } from "../lib/campaign-store";
import {
  JOURNEY_STEPS,
  getProfile,
  setJourneyStep,
  setWalletLinked,
  getOrCreateWallet,
  pushActivity,
} from "../lib/session";

export function JourneyPage() {
  const [profile, setProfile] = useState(getProfile());
  const journeyCampaigns = listForZone("journey");
  const wallet = getOrCreateWallet();

  function advance(to: number) {
    if (to === 0) setWalletLinked(true);
    const next = setJourneyStep(to);
    pushActivity({
      id: `act_j_${Date.now()}`,
      type: "journey",
      label: `Journey: ${JOURNEY_STEPS[to]?.title ?? to}`,
      at: new Date().toISOString(),
    });
    setProfile({ ...next });
  }

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Adoption journey</h1>
      <p className="muted" style={{ marginBottom: 20, maxWidth: 560 }}>
        Guided path from first wallet to rewarded protocol use. Lending unlocks
        at step 6 after a real campaign payout.
      </p>
      <ol style={{ paddingLeft: 0, listStyle: "none", marginBottom: 28 }}>
        {JOURNEY_STEPS.map((s) => {
          const done = profile.journeyStep > s.id;
          const current = profile.journeyStep === s.id;
          return (
            <li key={s.id} className="card" style={{ opacity: done || current ? 1 : 0.55 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <span className="badge">{s.id}</span>
                  {done && <span className="badge override">done</span>}
                  {current && <span className="badge contract">current</span>}
                  <h3 style={{ margin: "8px 0 4px" }}>{s.title}</h3>
                  <p className="muted" style={{ margin: 0 }}>{s.hint}</p>
                </div>
                {current && s.id < 5 && (
                  <button className="btn" type="button" onClick={() => advance(s.id + 1)}>
                    Mark done
                  </button>
                )}
                {current && s.id === 5 && (
                  <Link className="btn" to="/discover">Claim on Discover</Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="muted" style={{ fontSize: 13 }}>
        Wallet {wallet.address.slice(0, 8)}… · linked {String(wallet.linked)}
      </p>
      {journeyCampaigns.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginTop: 24 }}>Journey zone campaigns</h2>
          <div className="grid">
            {journeyCampaigns.map((c) => (
              <Link key={c.id} to={`/campaigns/${c.id}`} className="card">
                <span className={`badge ${c.priority}`}>{c.priority}</span>
                <h3>{c.title}</h3>
                <p className="muted">{c.hook}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
