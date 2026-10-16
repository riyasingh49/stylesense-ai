import { getSupabaseClient } from "../config/database";

export interface CompanyRecord {
  id: string;
  name: string;
  website: string | null;
  domain: string | null;
  industry: string | null;
  description: string | null;
  location: string | null;
  employee_count: number | null;
  source_url: string | null;
  source_evidence: string | null;
  discovery_method: "mock" | "web_search" | "manual";
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyInput {
  name: string;
  website?: string | null;
  domain?: string | null;
  industry?: string | null;
  description?: string | null;
  location?: string | null;
  employee_count?: number | null;
  source_url?: string | null;
  source_evidence?: string | null;
  discovery_method?: "mock" | "web_search" | "manual";
}

export interface ListCompaniesOptions {
  limit?: number;
  offset?: number;
  industry?: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const listCompanies = async (
  options: ListCompaniesOptions = {},
): Promise<{ companies: CompanyRecord[]; total: number }> => {
  const limit = Math.min(
    Math.max(Math.trunc(options.limit ?? DEFAULT_LIMIT), 1),
    MAX_LIMIT,
  );
  const offset = Math.max(Math.trunc(options.offset ?? 0), 0);

  let query = getSupabaseClient()
    .from("companies")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.industry?.trim()) {
    query = query.ilike("industry", `%${options.industry.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Unable to list companies: ${error.message}`);
  }

  return {
    companies: (data ?? []) as CompanyRecord[],
    total: count ?? 0,
  };
};

export const getCompanyById = async (
  id: string,
): Promise<CompanyRecord | null> => {
  const { data, error } = await getSupabaseClient()
    .from("companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to retrieve company: ${error.message}`);
  }

  return (data as CompanyRecord | null) ?? null;
};

export const createCompany = async (
  input: CreateCompanyInput,
): Promise<CompanyRecord> => {
  const { data, error } = await getSupabaseClient()
    .from("companies")
    .insert({
      ...input,
      discovery_method: input.discovery_method ?? "manual",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A company with this domain already exists.");
    }

    throw new Error(`Unable to create company: ${error.message}`);
  }

  return data as CompanyRecord;
};
