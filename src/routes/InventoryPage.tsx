import { useState } from "react";
import { listZones, invokeZone, listDeliveryEvents, getZoneStats } from "../lib/inventory-store";

export function InventoryPage() {
  const zones = listZones();
  const [log, setLog] = useState(listDeliveryEvents(20));
  const stats = getZoneStats();

  function run(zoneKey: string) {
    invokeZone({ zoneKey });
    setLog(listDeliveryEvents(20));
  }

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Inventory</h1>
      <p className="muted">Zone delivery (request → impression / blank).</p>
      <div className="grid cols-2">
        {zones.map((z) => (
          <div key={z.id} className="card">
            <h3>{z.name}</h3>
            <p className="muted">{z.description}</p>
            <button className="btn" type="button" onClick={() => run(z.key)}>
              Invoke zone
            </button>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Stats</h3>
        {stats.map((s) => (
          <p key={s.zoneKey} className="muted">
            {s.zoneKey}: req {s.requests} · imp {s.impressions} · blank {s.blanks} · done{" "}
            {s.completions}
          </p>
        ))}
      </div>
      <div className="card">
        <h3>Recent events</h3>
        {log.map((e) => (
          <p key={e.id} className="muted">
            {e.type} · {e.zoneKey} · {e.campaignId ?? "—"}
          </p>
        ))}
      </div>
    </div>
  );
}
