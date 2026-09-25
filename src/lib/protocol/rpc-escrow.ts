import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  type Connection,
} from "@solana/web3.js";
import { getProgramId } from "./escrow-client";

export function resolvedProgramId(): PublicKey {
  let id = getProgramId();
  try {
    const env =
      (import.meta as { env?: Record<string, string> }).env?.VITE_SWAN_PROGRAM_ID ||
      (typeof process !== "undefined" ? process.env?.SWAN_PROGRAM_ID : undefined);
    if (env && env.length >= 32) id = env;
  } catch {}
  try {
    return new PublicKey(id);
  } catch {
    return SystemProgram.programId;
  }
}

export function isPlaceholderProgram(): boolean {
  const id = getProgramId();
  return id.startsWith("SwanCmp") || id.includes("11111111");
}

export async function buildClaimMemoInstruction(args: {
  participant: PublicKey;
  campaignId: string;
  taskId: string;
  rewardLamports: number;
}): Promise<TransactionInstruction> {
  const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
  const data = Buffer.from(
    JSON.stringify({
      swan: "claim_v1",
      campaignId: args.campaignId,
      taskId: args.taskId,
      rewardLamports: args.rewardLamports,
      participant: args.participant.toBase58(),
    }),
    "utf8",
  );
  return new TransactionInstruction({
    keys: [{ pubkey: args.participant, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM,
    data,
  });
}

export async function submitRpcClaim(args: {
  connection: Connection;
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>;
  participant: PublicKey;
  campaignId: string;
  taskId: string;
  rewardLamports: number;
}): Promise<{ ok: boolean; signature?: string; reason?: string }> {
  if (isPlaceholderProgram()) {
    return {
      ok: false,
      reason:
        "program_not_deployed — run scripts/deploy-escrow.sh and set VITE_SWAN_PROGRAM_ID",
    };
  }
  try {
    const ix = await buildClaimMemoInstruction({
      participant: args.participant,
      campaignId: args.campaignId,
      taskId: args.taskId,
      rewardLamports: args.rewardLamports,
    });
    const tx = new Transaction().add(ix);
    const { blockhash } = await args.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = args.participant;
    const signature = await args.sendTransaction(tx, args.connection);
    await args.connection.confirmTransaction(signature, "confirmed");
    return { ok: true, signature };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "rpc_claim_failed",
    };
  }
}
