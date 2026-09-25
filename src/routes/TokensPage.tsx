import { useEffect, useState } from "react";
import { aggregateTokenList, getSeedTokens, type TokenInfo } from "../lib/tokens";
import { SWAN_ACTIONS, actionsRequiringHelius } from "../lib/agent";

export function TokensPage() {
  const [tokens, setTokens] = useState<TokenInfo[]>(getSeedTokens());
  const [source, setSource] = useState("seed");
  const [q, setQ] = useState("");
  const heliusActions = actionsRequiringHelius();

  useEffect(() => {
    let cancelled = false;
    aggregateTokenList()
      .then((list) => {
        if (cancelled) return;
        setTokens(list.tokens.slice(0, 40));
        setSource(list.name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = tokens.filter((t) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(s) ||
      t.name.toLowerCase().includes(s) ||
      t.address.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Tokens & actions</h1>
      <p className="muted" style={{ maxWidth: 640, marginBottom: 16 }}>
        Patterns from{" "}
        <a href="https://github.com/solana-labs/token-aggregator" target="_blank" rel="noreferrer">
          solana-labs/token-aggregator
        </a>{" "}
        and{" "}
        <a href="https://github.com/sendaifun/solana-agent-kit" target="_blank" rel="noreferrer">
          sendaifun/solana-agent-kit
        </a>{" "}
        — <strong>not installed</strong>. Clean-room token list aggregator and
        agent-style action catalog for campaigns.
      </p>

      <div className="card">
        <h3>Token aggregator</h3>
        <p className="muted">Source: {source}</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by symbol, name, or mint"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "#0b0b0f",
            color: "var(--text)",
          }}
        />
        <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 280, overflow: "auto" }}>
          {filtered.slice(0, 25).map((t) => (
            <li key={t.address} className="muted" style={{ marginBottom: 6 }}>
              <strong style={{ color: "var(--text)" }}>{t.symbol}</strong> · {t.name}
              <br />
              <code style={{ fontSize: 11 }}>{t.address}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Action catalog ({SWAN_ACTIONS.length})</h3>
        <p className="muted">
          Agent-kit style tools. {heliusActions.length} require Helius proof.
        </p>
        <div className="grid">
          {SWAN_ACTIONS.map((a) => (
            <div key={a.id} className="card" style={{ margin: 0 }}>
              <span className="badge">{a.category}</span>
              <span className={`badge ${a.proof === "helius_signature" ? "override" : ""}`}>
                {a.proof}
              </span>
              {a.taskType && <span className="badge">{a.taskType}</span>}
              <h4 style={{ margin: "8px 0 4px" }}>{a.name}</h4>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                {a.description}
              </p>
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                id: <code>{a.id}</code>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
