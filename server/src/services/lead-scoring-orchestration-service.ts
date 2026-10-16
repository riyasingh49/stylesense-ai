import {
    getLeadById,
    type LeadRecord,
} from "../repositories/lead-repository";
import {
    saveLeadScore,
    type LeadScoreHistoryRecord,
    type LeadScoreValues,
} from "../repositories/lead-scoring-repository";
import {
    calculateLeadScore,
    type LeadScoringInput,
} from "./lead-scoring-service";

export class LeadScoringOrchestrationError extends Error {
    constructor(
        message: string,
        public readonly code:
            | "LEAD_NOT_FOUND"
            | "SCORING_FAILED"
            | "SCORE_SAVE_FAILED",
    ) {
        super(message);
        this.name = "LeadScoringOrchestrationError";
    }
}

export interface LeadScoringOutcome {
    leadId: string;
    fitScore: number;
    engagementScore: number;
    totalScore: number;
    fitReasons: string[];
    engagementReasons: string[];
    history: LeadScoreHistoryRecord;
}

const buildScoringInput = (
    lead: LeadRecord,
    targetIndustry?: string | null,
    companyIndustry?: string | null,
): LeadScoringInput => ({
    jobTitle: lead.job_title,
    companyIndustry,
    targetIndustry,
    email: lead.email,
    linkedinUrl: lead.linkedin_url,
    sourceUrl: lead.source_url,
    sourceEvidence: lead.source_evidence,
});

const buildScoringReason = (
    fitReasons: string[],
    engagementReasons: string[],
): string =>
    [
        `Fit: ${fitReasons.length > 0 ? fitReasons.join("; ") : "No fit signals recorded"}`,
        `Engagement: ${engagementReasons.length > 0
            ? engagementReasons.join("; ")
            : "No engagement signals recorded"
        }`,
    ].join(" | ");

export const scoreLead = async (
    leadId: string,
    options?: {
        targetIndustry?: string | null;
        companyIndustry?: string | null;
    },
): Promise<LeadScoringOutcome> => {
    let lead: LeadRecord | null;

    try {
        lead = await getLeadById(leadId);
    } catch {
        throw new LeadScoringOrchestrationError(
            "Unable to retrieve the lead for scoring.",
            "SCORING_FAILED",
        );
    }

    if (!lead) {
        throw new LeadScoringOrchestrationError(
            "The requested lead was not found.",
            "LEAD_NOT_FOUND",
        );
    }

    let result: ReturnType<typeof calculateLeadScore>;

    try {
        result = calculateLeadScore(
            buildScoringInput(
                lead,
                options?.targetIndustry,
                options?.companyIndustry,
            ),
        );
    } catch {
        throw new LeadScoringOrchestrationError(
            "Unable to calculate the lead's scores.",
            "SCORING_FAILED",
        );
    }

    const scores: LeadScoreValues = {
        fitScore: result.fitScore,
        engagementScore: result.engagementScore,
        totalScore: result.totalScore,
        scoringReason: buildScoringReason(
            result.fitReasons,
            result.engagementReasons,
        ),
    };

    let history: LeadScoreHistoryRecord;

    try {
        history = await saveLeadScore(leadId, scores);
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "LEAD_NOT_FOUND"
        ) {
            throw new LeadScoringOrchestrationError(
                "The requested lead was not found.",
                "LEAD_NOT_FOUND",
            );
        }

        throw new LeadScoringOrchestrationError(
            "Unable to save the lead's scores.",
            "SCORE_SAVE_FAILED",
        );
    }

    return {
        leadId,
        fitScore: result.fitScore,
        engagementScore: result.engagementScore,
        totalScore: result.totalScore,
        fitReasons: result.fitReasons,
        engagementReasons: result.engagementReasons,
        history,
    };
};
