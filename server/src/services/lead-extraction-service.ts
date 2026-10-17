import { env } from "../config/env";
import { LeadDiscoveryError } from "../errors/lead-discovery-error";
import { GeminiLeadExtractionProvider } from "../providers/lead-extraction/gemini-lead-extraction-provider";
import { MockLeadExtractionProvider } from "../providers/lead-extraction/mock-lead-extraction-provider";
import type { LeadExtractionProvider } from "../providers/lead-extraction/lead-extraction-provider";
import type {
  DiscoveredLeadCandidate,
  LeadSearchResult,
} from "../types/lead-discovery";

export class LeadExtractionService {
  private readonly provider: LeadExtractionProvider;

  constructor(provider?: LeadExtractionProvider) {
    if (provider) {
      this.provider = provider;
      return;
    }

    switch (env.LEAD_EXTRACTION_PROVIDER) {
      case "gemini":
        this.provider = new GeminiLeadExtractionProvider();
        break;

      case "mock":
        this.provider = new MockLeadExtractionProvider();
        break;

      default:
        throw new LeadDiscoveryError(
          "The configured lead extraction provider is not supported.",
          "NOT_CONFIGURED",
          503,
        );
    }
  }

  async extract(
    searchResults: LeadSearchResult[],
    limit = 10,
  ): Promise<DiscoveredLeadCandidate[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
      throw new LeadDiscoveryError(
        "Extraction limit must be an integer between 1 and 10.",
        "INVALID_REQUEST",
        400,
      );
    }

    if (searchResults.length === 0) {
      return [];
    }

    return this.provider.extract(searchResults, limit);
  }
}