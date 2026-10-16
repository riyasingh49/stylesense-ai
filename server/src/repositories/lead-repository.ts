import { getSupabaseClient } from "../config/database";

export type DiscoveryMethod = "mock" | "web_search" | "manual";

export interface LeadRecord {
  id: string;
  company_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  source_url: string | null;
  source_evidence: string | null;
  discovery_method: DiscoveryMethod;
  fit_score: number;
  engagement_score: number;
  total_score: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  company_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  job_title?: string | null;
  linkedin_url?: string | null;
  source_url?: string | null;
  source_evidence?: string | null;
  discovery_method?: DiscoveryMethod;
}

export interface ListLeadsOptions {
  limit?: number;
  offset?: number;
  companyId?: string;
  industry?: string;
  search?: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const listLeads = async (
  options: ListLeadsOptions = {},
): Promise<{ leads: LeadRecord[]; total: number }> => {
  const limit = Math.min(
    Math.max(Math.trunc(options.limit ?? DEFAULT_LIMIT), 1),
    MAX_LIMIT,
  );
  const offset = Math.max(Math.trunc(options.offset ?? 0), 0);

  let query = getSupabaseClient()
    .from("leads")
    .select("*, companies!leads_company_id_fkey(industry)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.companyId) {
    query = query.eq("company_id", options.companyId);
  }

  if (options.search?.trim()) {
    const search = options.search.trim().replace(/[%_,()]/g, "");
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,job_title.ilike.%${search}%`,
      );
    }
  }

  if (options.industry?.trim()) {
    query = query.ilike("companies.industry", `%${options.industry.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Unable to list leads: ${error.message}`);
  }

  return {
    leads: (data ?? []).map((row) => {
      const { companies: _company, ...lead } = row;
      return lead as LeadRecord;
    }),
    total: count ?? 0,
  };
};

export const getLeadById = async (
  id: string,
): Promise<LeadRecord | null> => {
  const { data, error } = await getSupabaseClient()
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to retrieve lead: ${error.message}`);
  }

  return (data as LeadRecord | null) ?? null;
};

export const createLead = async (
  input: CreateLeadInput,
): Promise<LeadRecord> => {
  const { data, error } = await getSupabaseClient()
    .from("leads")
    .insert({
      ...input,
      discovery_method: input.discovery_method ?? "manual",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A lead with this email address already exists.");
    }

    if (error.code === "23503") {
      throw new Error("The specified company does not exist.");
    }

    throw new Error(`Unable to create lead: ${error.message}`);
  }

  return data as LeadRecord;
};
