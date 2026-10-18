import { getSupabaseClient } from "../config/database";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "paused"
  | "completed"
  | "failed";

export interface CampaignRecord {
  id: string;
  name: string;
  subject: string;
  email_body: string;
  status: CampaignStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  subject: string;
  email_body: string;
  scheduled_at?: string | null;
}

export interface UpdateCampaignInput {
  name?: string;
  subject?: string;
  email_body?: string;
  scheduled_at?: string | null;
}

export interface ListCampaignsOptions {
  limit?: number;
  offset?: number;
  status?: CampaignStatus;
}

export class CampaignRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "CAMPAIGN_NOT_FOUND"
      | "DUPLICATE_CAMPAIGN"
      | "CAMPAIGN_SAVE_FAILED"
      | "CAMPAIGN_RETRIEVAL_FAILED",
  ) {
    super(message);
    this.name = "CampaignRepositoryError";
  }
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const listCampaigns = async (
  options: ListCampaignsOptions = {},
): Promise<{ campaigns: CampaignRecord[]; total: number }> => {
  const limit = Math.min(
    Math.max(Math.trunc(options.limit ?? DEFAULT_LIMIT), 1),
    MAX_LIMIT,
  );
  const offset = Math.max(Math.trunc(options.offset ?? 0), 0);

  let query = getSupabaseClient()
    .from("campaigns")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new CampaignRepositoryError(
      "Unable to retrieve campaigns.",
      "CAMPAIGN_RETRIEVAL_FAILED",
    );
  }

  return {
    campaigns: (data ?? []) as CampaignRecord[],
    total: count ?? 0,
  };
};

export const getCampaignById = async (
  id: string,
): Promise<CampaignRecord | null> => {
  const { data, error } = await getSupabaseClient()
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new CampaignRepositoryError(
      "Unable to retrieve the campaign.",
      "CAMPAIGN_RETRIEVAL_FAILED",
    );
  }

  return (data as CampaignRecord | null) ?? null;
};

export const createCampaign = async (
  input: CreateCampaignInput,
): Promise<CampaignRecord> => {
  const { data, error } = await getSupabaseClient()
    .from("campaigns")
    .insert({
      name: input.name,
      subject: input.subject,
      email_body: input.email_body,
      scheduled_at: input.scheduled_at ?? null,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    throw new CampaignRepositoryError(
      "Unable to create the campaign.",
      "CAMPAIGN_SAVE_FAILED",
    );
  }

  return data as CampaignRecord;
};

export const updateCampaign = async (
  id: string,
  input: UpdateCampaignInput,
): Promise<CampaignRecord> => {
  const { data, error } = await getSupabaseClient()
    .from("campaigns")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "draft")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new CampaignRepositoryError(
      "Unable to update the campaign.",
      "CAMPAIGN_SAVE_FAILED",
    );
  }

  if (!data) {
    const existing = await getCampaignById(id);

    if (!existing) {
      throw new CampaignRepositoryError(
        "The requested campaign was not found.",
        "CAMPAIGN_NOT_FOUND",
      );
    }

    throw new CampaignRepositoryError(
      "Only draft campaigns can be edited.",
      "CAMPAIGN_SAVE_FAILED",
    );
  }

  return data as CampaignRecord;
};
