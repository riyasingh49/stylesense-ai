import { getSupabaseClient } from "../config/database";

export type SuppressionReason =
  | "unsubscribe"
  | "bounce"
  | "complaint"
  | "manual";

export interface SuppressionRecord {
  id: string;
  email: string;
  reason: SuppressionReason;
  source: string | null;
  created_at: string;
}

export class SuppressionRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SuppressionRepositoryError";
  }
}

export const isEmailSuppressed = async (
  email: string,
): Promise<boolean> => {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await getSupabaseClient()
    .from("suppression_list")
    .select("id")
    .ilike("email", normalizedEmail)
    .limit(1);

  if (error) {
    throw new SuppressionRepositoryError(
      "Unable to verify the email suppression status.",
    );
  }

  return (data ?? []).length > 0;
};

export const listSuppressedEmails = async (
  limit = 100,
  offset = 0,
): Promise<{ records: SuppressionRecord[]; total: number }> => {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
  const safeOffset = Math.max(Math.trunc(offset), 0);

  const { data, error, count } = await getSupabaseClient()
    .from("suppression_list")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) {
    throw new SuppressionRepositoryError(
      "Unable to retrieve suppressed email addresses.",
    );
  }

  return {
    records: (data ?? []) as SuppressionRecord[],
    total: count ?? 0,
  };
};