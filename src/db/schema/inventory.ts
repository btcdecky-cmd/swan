import type { CampaignZone } from "./campaigns";

export type DeliveryEventType = "request" | "blank" | "impression" | "completion";

export interface DeliveryEvent {
  id: string;
  type: DeliveryEventType;
  zoneKey: string;
  campaignId?: string;
  taskId?: string;
  wallet?: string;
  at: string;
}

export interface DeliveryContext {
  zoneKey: CampaignZone | string;
  wallet?: string;
}

export interface ZoneStats {
  zoneKey: string;
  requests: number;
  impressions: number;
  blanks: number;
  completions: number;
}

export interface CampaignStats {
  campaignId: string;
  impressions: number;
  completions: number;
}
