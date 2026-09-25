export function BagsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Bags.fm</h1>
      <p className="muted">
        Client at <code>src/lib/bags/</code>. Set BAGS_API_KEY for live pools / launches.
      </p>
      <div className="card">
        <h3>Status</h3>
        <p className="muted">Optional integration — see README.</p>
      </div>
    </div>
  );
}
