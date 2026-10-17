
import type {
    DiscoveredLeadCandidate,
    LeadSearchResult,
  } from "../../types/lead-discovery";
  import type { LeadExtractionProvider } from "./lead-extraction-provider";

  export class MockLeadExtractionProvider implements LeadExtractionProvider {
    async extract(
      _searchResults: LeadSearchResult[],
      limit: number,
    ): Promise<DiscoveredLeadCandidate[]> {
      const demoLeads: DiscoveredLeadCandidate[] = [
        {
          firstName: "Alex",
          lastName: "Morgan",
          email: null,
          jobTitle: "Head of Merchandising",
          companyName: "Example Fashion Retailer",
          companyIndustry: "Fashion Retail",
          companyWebsite: "https://example.com",
          linkedinUrl: null,
          sourceUrl: "https://example.com/synthetic-demo-data",
          sourceEvidence:
            "SYNTHETIC DEMO DATA — fabricated record, not a verified person or company.",
          isSynthetic: true,
        },
        {
          firstName: "Taylor",
          lastName: "Reed",
          email: null,
          jobTitle: "Demand Planning Manager",
          companyName: "Example Apparel Group",
          companyIndustry: "Apparel",
          companyWebsite: "https://example.com",
          linkedinUrl: null,
          sourceUrl: "https://example.com/synthetic-demo-data",
          sourceEvidence:
            "SYNTHETIC DEMO DATA — fabricated record, not a verified person or company.",
          isSynthetic: true,
        },
      ];

      return demoLeads.slice(0, limit);
    }
  }
