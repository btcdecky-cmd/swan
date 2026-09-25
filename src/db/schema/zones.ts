import type { CampaignZone } from "./campaigns";

export interface Zone {
  id: string;
  key: CampaignZone;
  name: string;
  description: string;
  active: boolean;
}

export const DEFAULT_ZONES: Zone[] = [
  { id: "z_discover", key: "discover", name: "Discover", description: "Main campaign marketplace", active: true },
  { id: "z_journey", key: "journey", name: "Journey", description: "Onboarding path", active: true },
  { id: "z_project", key: "project", name: "Project", description: "Project detail surface", active: true },
  { id: "z_lend", key: "lend_teaser", name: "Lend teaser", description: "Lending unlock teaser", active: true },
];
