import { getSupabaseClient } from "../config/database";

export type CampaignLeadStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "replied"
  | "bounced"
  | "failed"
  | "unsubscribed"
  | "suppressed";

export interface CampaignLeadRecord {
  id: string;
  campaign_id: string;
  lead_id: string;
  status: CampaignLeadStatus;
  provider_message_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignLeadInput {
  campaign_id: string;
  lead_id: string;
}

export class CampaignLeadRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "CAMPAIGN_LEADS_RETRIEVAL_FAILED"
      | "CAMPAIGN_LEADS_SAVE_FAILED"
      | "CAMPAIGN_LEAD_NOT_FOUND",
  ) {
    super(message);
    this.name = "CampaignLeadRepositoryError";
  }
}

export const listCampaignLeads = async (
  campaignId: string,
): Promise<CampaignLeadRecord[]> => {
  const { data, error } = await getSupabaseClient()
    .from("campaign_leads")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new CampaignLeadRepositoryError(
      "Unable to retrieve campaign leads.",
      "CAMPAIGN_LEADS_RETRIEVAL_FAILED",
    );
  }

  return (data ?? []) as CampaignLeadRecord[];
};

export const assignLeadsToCampaign = async (
  campaignId: string,
  leadIds: string[],
): Promise<CampaignLeadRecord[]> => {
  const uniqueLeadIds = [...new Set(leadIds)];

  if (uniqueLeadIds.length === 0) {
    return [];
  }

  const assignments: CreateCampaignLeadInput[] = uniqueLeadIds.map(
    (leadId) => ({
      campaign_id: campaignId,
      lead_id: leadId,
    }),
  );

  const { data, error } = await getSupabaseClient()
    .from("campaign_leads")
    .upsert(assignments, {
      onConflict: "campaign_id,lead_id",
      ignoreDuplicates: true,
    })
    .select("*");

  if (error) {
    throw new CampaignLeadRepositoryError(
      "Unable to assign leads to the campaign.",
      "CAMPAIGN_LEADS_SAVE_FAILED",
    );
  }

  return (data ?? []) as CampaignLeadRecord[];
};

export const getCampaignLeadById = async (
  campaignId: string,
  campaignLeadId: string,
): Promise<CampaignLeadRecord | null> => {
  const { data, error } = await getSupabaseClient()
    .from("campaign_leads")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("id", campaignLeadId)
    .maybeSingle();

  if (error) {
    throw new CampaignLeadRepositoryError(
      "Unable to retrieve the campaign lead.",
      "CAMPAIGN_LEADS_RETRIEVAL_FAILED",
    );
  }

  return (data as CampaignLeadRecord | null) ?? null;
};