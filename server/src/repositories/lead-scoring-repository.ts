import { getSupabaseClient } from "../config/database";

export interface LeadScoreValues {
  fitScore: number;
  engagementScore: number;
  totalScore: number;
  scoringReason: string;
}

export interface LeadScoreHistoryRecord {
  id: string;
  lead_id: string;
  fit_score: number;
  engagement_score: number;
  total_score: number;
  scoring_reason: string | null;
  created_at: string;
}

export class LeadScoringRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "LEAD_NOT_FOUND"
      | "SCORE_SAVE_FAILED"
      | "SCORE_HISTORY_RETRIEVAL_FAILED",
  ) {
    super(message);
    this.name = "LeadScoringRepositoryError";
  }
}

/**
 * Atomically updates a lead's current scores and appends score history.
 * The save_lead_score PostgreSQL function must be applied first.
 */
export const saveLeadScore = async (
  leadId: string,
  scores: LeadScoreValues,
): Promise<LeadScoreHistoryRecord> => {
  const { data, error } = await getSupabaseClient()
    .rpc("save_lead_score", {
      p_lead_id: leadId,
      p_fit_score: scores.fitScore,
      p_engagement_score: scores.engagementScore,
      p_total_score: scores.totalScore,
      p_scoring_reason: scores.scoringReason,
    });

  if (error) {
    if (error.code === "P0002") {
      throw new LeadScoringRepositoryError(
        "The requested lead was not found.",
        "LEAD_NOT_FOUND",
      );
    }

    throw new LeadScoringRepositoryError(
      "Unable to save the lead's scores and history.",
      "SCORE_SAVE_FAILED",
    );
  }

  const record = Array.isArray(data) ? data[0] : data;

  if (!record) {
    throw new LeadScoringRepositoryError(
      "The database did not return the saved score history.",
      "SCORE_SAVE_FAILED",
    );
  }

  return record as LeadScoreHistoryRecord;
};

/**
 * Returns the most recent score-history entries for a lead.
 */
export const listLeadScoreHistory = async (
  leadId: string,
  limit = 20,
): Promise<LeadScoreHistoryRecord[]> => {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);

  const { data, error } = await getSupabaseClient()
    .from("lead_score_history")
    .select(
      "id, lead_id, fit_score, engagement_score, total_score, scoring_reason, created_at",
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new LeadScoringRepositoryError(
      "Unable to retrieve the lead's score history.",
      "SCORE_HISTORY_RETRIEVAL_FAILED",
    );
  }

  return (data ?? []) as LeadScoreHistoryRecord[];
};
