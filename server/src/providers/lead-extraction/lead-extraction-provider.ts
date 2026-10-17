import type {
    DiscoveredLeadCandidate,
    LeadSearchResult,
  } from "../../types/lead-discovery";

  export interface LeadExtractionProvider {
    extract(
      searchResults: LeadSearchResult[],
      limit: number,
    ): Promise<DiscoveredLeadCandidate[]>;
  }
