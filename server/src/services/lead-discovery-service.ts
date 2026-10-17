import type {
    DiscoveredLeadCandidate,
    LeadDiscoveryInput,
    LeadSearchResult,
  } from "../types/lead-discovery";
  import { LeadDiscoveryError } from "../errors/lead-discovery-error";
  import {
    LangSearchSearchProvider,
    type LeadDiscoverySearchProvider,
  } from "../providers/langsearch/langsearch-provider";
  import { LeadExtractionService } from "./lead-extraction-service";

  export class LeadDiscoveryService {
    constructor(
      private readonly searchProvider: LeadDiscoverySearchProvider =
        new LangSearchSearchProvider(),
      private readonly extractionService: LeadExtractionService =
        new LeadExtractionService(),
    ) {}

    async discover(
      input: LeadDiscoveryInput,
    ): Promise<{
      searchResultCount: number;
      leads: DiscoveredLeadCandidate[];
    }> {
      const normalizedInput = this.validateInput(input);
      const limit = normalizedInput.limit ?? 10;
      const query = this.buildSearchQuery(normalizedInput);

      const searchResults: LeadSearchResult[] =
        await this.searchProvider.search(query, limit);

      const leads = await this.extractionService.extract(
        searchResults,
        limit,
      );

      return {
        searchResultCount: searchResults.length,
        leads,
      };
    }

    private validateInput(input: LeadDiscoveryInput): LeadDiscoveryInput {
      if (!input.industry?.trim()) {
        throw new LeadDiscoveryError(
          "Industry is required.",
          "INVALID_REQUEST",
          400,
        );
      }

      if (!input.region?.trim()) {
        throw new LeadDiscoveryError(
          "Region is required.",
          "INVALID_REQUEST",
          400,
        );
      }

      if (
        !Array.isArray(input.jobTitles) ||
        input.jobTitles.length === 0 ||
        input.jobTitles.length > 10 ||
        input.jobTitles.some(
          (title) => typeof title !== "string" || !title.trim(),
        )
      ) {
        throw new LeadDiscoveryError(
          "Provide between 1 and 10 valid target job titles.",
          "INVALID_REQUEST",
          400,
        );
      }

      const limit = input.limit ?? 10;

      if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
        throw new LeadDiscoveryError(
          "Limit must be an integer between 1 and 10.",
          "INVALID_REQUEST",
          400,
        );
      }

      return {
        industry: input.industry.trim(),
        region: input.region.trim(),
        companySize: input.companySize?.trim() || undefined,
        jobTitles: input.jobTitles.map((title) => title.trim()),
        limit,
      };
    }

    private buildSearchQuery(input: LeadDiscoveryInput): string {
      const titles = input.jobTitles
        .map((title) => `"${title}"`)
        .join(" OR ");

      const companySize = input.companySize
        ? ` Company size: ${input.companySize}.`
        : "";

      return [
        `Find publicly available company and professional information for the ${input.industry} industry in ${input.region}.`,
        `Focus on people holding these roles: ${titles}.`,
        companySize,
        "Prioritize company websites, professional profiles, company announcements, and credible business sources.",
        "Return relevant pages containing identifiable people, their job titles, company names, and supporting evidence.",
      ]
        .filter(Boolean)
        .join(" ");
    }
  }
