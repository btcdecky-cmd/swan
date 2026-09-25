import { Connection, clusterApiUrl, type Cluster } from "@solana/web3.js";

function readEnv(name: string): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env?.[name]) return process.env[name];
  } catch {}
  try {
    return (import.meta as { env?: Record<string, string | undefined> }).env?.[name];
  } catch {
    return undefined;
  }
}

export function getRpcEndpoint(): string {
  const explicit = readEnv("VITE_SOLANA_RPC_URL") || readEnv("SOLANA_RPC_URL");
  if (explicit && !explicit.includes("placeholder")) return explicit;
  const helius = readEnv("VITE_HELIUS_API_KEY") || readEnv("HELIUS_API_KEY");
  const network = (readEnv("HELIUS_NETWORK") || "devnet") as "mainnet" | "devnet";
  if (helius && !helius.includes("placeholder")) {
    const host =
      network === "mainnet"
        ? "https://mainnet.helius-rpc.com"
        : "https://devnet.helius-rpc.com";
    return `${host}/?api-key=${helius}`;
  }
  const cluster = (readEnv("SOLANA_NETWORK") || "devnet").replace("-beta", "") as Cluster;
  return clusterApiUrl(cluster === "mainnet-beta" ? "devnet" : cluster);
}

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) _connection = new Connection(getRpcEndpoint(), "confirmed");
  return _connection;
}

export function getClusterLabel(): string {
  const ep = getRpcEndpoint();
  if (ep.includes("mainnet")) return "mainnet-beta";
  if (ep.includes("devnet")) return "devnet";
  if (ep.includes("testnet")) return "testnet";
  return "custom";
}
