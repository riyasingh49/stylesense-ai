import { z } from "zod";
import type {
  DiscoveredLeadCandidate,
  LeadSearchResult,
} from "../types/lead-discovery";
import { LeadDiscoveryError } from "../errors/lead-discovery-error";

const optionalText = z.string().trim().min(1).nullable();

const httpUrl = z
  .string()
  .url()
  .refine(
    (value) => {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    },
    { message: "URL must use HTTP or HTTPS." },
  );

const candidateSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().nullable(),
  jobTitle: z.string().trim().min(1).max(150),
  companyName: z.string().trim().min(1).max(200),
  companyIndustry: optionalText,
  companyWebsite: httpUrl.nullable(),
  linkedinUrl: httpUrl.nullable(),
  sourceUrl: httpUrl,
  sourceEvidence: z.string().trim().min(1).max(2000),
});

const candidateArraySchema = z.array(candidateSchema).max(10);

function hasEvidenceSupport(
    evidence: string,
    source: LeadSearchResult,
  ): boolean {
    const normalize = (value: string): string =>
      value
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    const evidenceText = normalize(evidence);
    const sourceText = normalize(`${source.title} ${source.snippet}`);

    if (!evidenceText || !sourceText) {
      return false;
    }

    if (sourceText.includes(evidenceText)) {
      return true;
    }

    const evidenceTerms = new Set(
      evidenceText.split(/\s+/).filter((term) => term.length > 2),
    );

    const sourceTerms = new Set(
      sourceText.split(/\s+/).filter((term) => term.length > 2),
    );

    if (evidenceTerms.size === 0) {
      return false;
    }

    const matchedTerms = [...evidenceTerms].filter((term) =>
      sourceTerms.has(term),
    ).length;

    return matchedTerms / evidenceTerms.size >= 0.6;
}


export class LeadExtractionValidator {
  validate(
    rawJson: string,
    searchResults: LeadSearchResult[],
    limit: number,
  ): DiscoveredLeadCandidate[] {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new LeadDiscoveryError(
        "The extraction provider returned invalid JSON.",
        "INVALID_RESPONSE",
        502,
      );
    }

    const validation = candidateArraySchema.safeParse(parsed);

    if (!validation.success) {
      throw new LeadDiscoveryError(
        "The extraction provider returned records with an invalid structure.",
        "INVALID_RESPONSE",
        502,
      );
    }

    const allowedSources = new Map(
      searchResults.map((result) => [result.url, result]),
    );

    const accepted: DiscoveredLeadCandidate[] = [];
    const seen = new Set<string>();

    for (const candidate of validation.data) {
      const source = allowedSources.get(candidate.sourceUrl);

      if (!source) continue;

      if (!hasEvidenceSupport(candidate.sourceEvidence, source)) {
        continue;
      }

      const identity = [
        candidate.firstName.toLowerCase(),
        candidate.lastName.toLowerCase(),
        candidate.companyName.toLowerCase(),
        candidate.jobTitle.toLowerCase(),
      ].join("|");

      if (seen.has(identity)) continue;
      seen.add(identity);

      accepted.push({
        ...candidate,
        sourceUrl: source.url,
      });

      if (accepted.length >= limit) break;
    }

    return accepted;
  }
}