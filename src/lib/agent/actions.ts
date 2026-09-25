/**
 * Swan action catalog — patterns from sendaifun/solana-agent-kit (NOT installed).
 */

export type ActionCategory =
  | "token"
  | "defi"
  | "stake"
  | "lend"
  | "discover"
  | "social"
  | "system";

export type ActionProofKind = "none" | "helius_signature" | "offchain";

export interface SwanAction {
  id: string;
  name: string;
  description: string;
  category: ActionCategory;
  taskType?: string;
  proof: ActionProofKind;
  inputs: { name: string; type: string; required?: boolean }[];
  relatedMints?: string[];
}

export const SWAN_ACTIONS: SwanAction[] = [
  {
    id: "get_balance",
    name: "Get SOL / token balance",
    description: "Read wallet balance (Helius RPC / DAS).",
    category: "token",
    proof: "none",
    inputs: [{ name: "wallet", type: "pubkey", required: true }],
  },
  {
    id: "resolve_token",
    name: "Resolve token metadata",
    description: "Look up mint / symbol via Swan token aggregator.",
    category: "token",
    proof: "none",
    inputs: [{ name: "mintOrSymbol", type: "string", required: true }],
  },
  {
    id: "visit_project",
    name: "Visit project",
    description: "User opens project URL / docs (off-chain).",
    category: "discover",
    taskType: "visit",
    proof: "offchain",
    inputs: [{ name: "url", type: "url", required: true }],
  },
  {
    id: "complete_quiz",
    name: "Complete educational quiz",
    description: "Protocol education step in adoption journey.",
    category: "discover",
    taskType: "quiz",
    proof: "offchain",
    inputs: [{ name: "quizId", type: "string", required: true }],
  },
  {
    id: "onchain_interact",
    name: "Eligible on-chain interaction",
    description: "Successful tx; Helius verifies.",
    category: "defi",
    taskType: "onchain",
    proof: "helius_signature",
    inputs: [
      { name: "programId", type: "pubkey", required: false },
      { name: "signature", type: "signature", required: true },
    ],
  },
  {
    id: "swap_tokens",
    name: "Swap tokens",
    description: "DEX swap proof = confirmed swap tx.",
    category: "defi",
    taskType: "swap",
    proof: "helius_signature",
    inputs: [
      { name: "inputMint", type: "mint", required: true },
      { name: "outputMint", type: "mint", required: true },
      { name: "signature", type: "signature", required: true },
    ],
  },
  {
    id: "stake_sol",
    name: "Stake SOL",
    description: "Stake or LST mint; Helius verifies tx.",
    category: "stake",
    taskType: "stake",
    proof: "helius_signature",
    inputs: [
      { name: "amountSol", type: "number", required: true },
      { name: "signature", type: "signature", required: true },
    ],
  },
  {
    id: "lend_assets",
    name: "Lend assets",
    description: "Supply to lending after adoption unlock.",
    category: "lend",
    taskType: "onchain",
    proof: "helius_signature",
    inputs: [
      { name: "mint", type: "mint", required: true },
      { name: "amount", type: "number", required: true },
      { name: "signature", type: "signature", required: true },
    ],
  },
  {
    id: "social_verify",
    name: "Social task",
    description: "Follow / share (off-chain).",
    category: "social",
    taskType: "social",
    proof: "offchain",
    inputs: [{ name: "platform", type: "string", required: true }],
  },
  {
    id: "list_campaigns",
    name: "List active campaigns",
    description: "Agent-readable inventory for discover zone.",
    category: "system",
    proof: "none",
    inputs: [{ name: "zone", type: "string", required: false }],
  },
  {
    id: "claim_reward",
    name: "Claim campaign reward",
    description: "Swan protocol claim (escrow + proof rules).",
    category: "system",
    proof: "helius_signature",
    inputs: [
      { name: "campaignId", type: "string", required: true },
      { name: "taskId", type: "string", required: true },
      { name: "signature", type: "signature", required: false },
    ],
  },
];

export function getAction(id: string) {
  return SWAN_ACTIONS.find((a) => a.id === id);
}

export function actionsForTaskType(taskType: string) {
  return SWAN_ACTIONS.filter((a) => a.taskType === taskType);
}

export function actionsRequiringHelius() {
  return SWAN_ACTIONS.filter((a) => a.proof === "helius_signature");
}

export function toToolDescriptors() {
  return SWAN_ACTIONS.map((a) => ({
    name: a.id,
    description: `${a.name}: ${a.description}`,
    parameters: {
      type: "object",
      properties: Object.fromEntries(
        a.inputs.map((i) => [
          i.name,
          { type: i.type === "number" ? "number" : "string" },
        ]),
      ),
      required: a.inputs.filter((i) => i.required).map((i) => i.name),
    },
  }));
}
