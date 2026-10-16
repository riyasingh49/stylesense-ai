export interface LeadScoringInput {
    jobTitle?: string | null;
    companyIndustry?: string | null;
    targetIndustry?: string | null;
    email?: string | null;
    linkedinUrl?: string | null;
    sourceUrl?: string | null;
    sourceEvidence?: string | null;
    emailOpens?: number;
    linkClicks?: number;
    replies?: number;
    bounced?: boolean;
    unsubscribed?: boolean;
  }
  
  export interface LeadScoreResult {
    fitScore: number;
    engagementScore: number;
    totalScore: number;
    fitReasons: string[];
    engagementReasons: string[];
  }
  
  const clampScore = (score: number): number =>
    Math.min(100, Math.max(0, score));
  
  const normalizeText = (value?: string | null): string =>
    value?.trim().toLowerCase() ?? "";
  
  const hasValue = (value?: string | null): boolean =>
    Boolean(value?.trim());
  
  export const calculateFitScore = (
    input: LeadScoringInput,
  ): { score: number; reasons: string[] } => {
    let score = 0;
    const reasons: string[] = [];
    const jobTitle = normalizeText(input.jobTitle);
    const companyIndustry = normalizeText(input.companyIndustry);
    const targetIndustry = normalizeText(input.targetIndustry);
  
    if (jobTitle) {
      score += 10;
      reasons.push("Job title is available.");
  
      const decisionMakerTerms = [
        "chief",
        "ceo",
        "cto",
        "cfo",
        "coo",
        "founder",
        "owner",
        "director",
        "vp",
        "vice president",
        "head of",
        "president",
      ];
  
      const leadershipTerms = [
        "manager",
        "lead",
        "principal",
      ];
  
      if (decisionMakerTerms.some((term) => jobTitle.includes(term))) {
        score += 30;
        reasons.push("Job title indicates a decision-maker role.");
      } else if (
        leadershipTerms.some((term) => jobTitle.includes(term))
      ) {
        score += 20;
        reasons.push("Job title indicates a leadership role.");
      } else {
        score += 10;
        reasons.push("Job title is available but does not match a leadership category.");
      }
    }
  
    if (companyIndustry && targetIndustry) {
      if (
        companyIndustry === targetIndustry ||
        companyIndustry.includes(targetIndustry) ||
        targetIndustry.includes(companyIndustry)
      ) {
        score += 25;
        reasons.push("Company industry matches the target industry.");
      }
    } else if (companyIndustry) {
      score += 10;
      reasons.push("Company industry is available; no target industry was provided.");
    }
  
    if (hasValue(input.email)) {
      score += 15;
      reasons.push("Email address is available.");
    }
  
    if (hasValue(input.linkedinUrl)) {
      score += 10;
      reasons.push("LinkedIn profile URL is available.");
    }
  
    if (hasValue(input.sourceUrl) && hasValue(input.sourceEvidence)) {
      score += 10;
      reasons.push("Source URL and supporting evidence are available.");
    } else if (hasValue(input.sourceUrl)) {
      score += 5;
      reasons.push("Source URL is available.");
    }
  
    return {
      score: clampScore(score),
      reasons,
    };
  };
  
  export const calculateEngagementScore = (
    input: LeadScoringInput,
  ): { score: number; reasons: string[] } => {
    if (input.unsubscribed) {
      return {
        score: 0,
        reasons: ["Contact has unsubscribed; engagement score is set to zero."],
      };
    }
  
    let score = 0;
    const reasons: string[] = [];
  
    const opens = Math.max(0, Math.trunc(input.emailOpens ?? 0));
    const clicks = Math.max(0, Math.trunc(input.linkClicks ?? 0));
    const replies = Math.max(0, Math.trunc(input.replies ?? 0));
  
    if (opens > 0) {
      const points = Math.min(opens, 3) * 10;
      score += points;
      reasons.push(`${Math.min(opens, 3)} email open(s): +${points}.`);
    }
  
    if (clicks > 0) {
      const points = Math.min(clicks, 2) * 20;
      score += points;
      reasons.push(`${Math.min(clicks, 2)} link click(s): +${points}.`);
    }
  
    if (replies > 0) {
      const points = Math.min(replies, 2) * 30;
      score += points;
      reasons.push(`${Math.min(replies, 2)} reply/replies: +${points}.`);
    }
  
    if (input.bounced) {
      score -= 50;
      reasons.push("Email bounced: -50.");
    }
  
    return {
      score: clampScore(score),
      reasons,
    };
  };
  
  export const calculateLeadScore = (
    input: LeadScoringInput,
  ): LeadScoreResult => {
    const fit = calculateFitScore(input);
    const engagement = calculateEngagementScore(input);
  
    const totalScore = clampScore(
      fit.score * 0.6 + engagement.score * 0.4,
    );
  
    return {
      fitScore: Number(fit.score.toFixed(2)),
      engagementScore: Number(engagement.score.toFixed(2)),
      totalScore: Number(totalScore.toFixed(2)),
      fitReasons: fit.reasons,
      engagementReasons: engagement.reasons,
    };
  };
  