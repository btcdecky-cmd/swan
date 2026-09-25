/** Helius-enforced on-chain task proof — no demo bypass. */

function readEnv(name: string): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env?.[name]) return process.env[name];
  } catch {}
  try {
    return (import.meta as { env?: Record<string, string> }).env?.[name];
  } catch {
    return undefined;
  }
}

export async function verifyOnchainTaskProof(args: {
  signature: string;
  wallet?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const key = readEnv("HELIUS_API_KEY") || readEnv("VITE_HELIUS_API_KEY");
  if (!key || key.includes("PLACEHOLDER") || key.includes("placeholder")) {
    return { ok: false, reason: "helius_not_configured" };
  }
  const { signature } = args;
  if (!signature || signature.length < 80) {
    return { ok: false, reason: "proof_signature_required" };
  }
  if (/(.)\1{10,}/.test(signature) || signature.includes("demo")) {
    return { ok: false, reason: "demo_signature_rejected" };
  }
  try {
    const network = readEnv("HELIUS_NETWORK") === "mainnet" ? "mainnet" : "devnet";
    const base =
      network === "mainnet"
        ? "https://mainnet.helius-rpc.com"
        : "https://devnet.helius-rpc.com";
    const res = await fetch(`${base}/?api-key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignatureStatuses",
        params: [[signature], { searchTransactionHistory: true }],
      }),
    });
    const json = (await res.json()) as {
      result?: { value?: { confirmationStatus?: string; err?: unknown }[] };
    };
    const st = json.result?.value?.[0];
    if (!st || st.err) return { ok: false, reason: "signature_not_confirmed_or_failed" };
    if (st.confirmationStatus !== "confirmed" && st.confirmationStatus !== "finalized") {
      return { ok: false, reason: "signature_not_confirmed_or_failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "helius_rpc_error" };
  }
}
