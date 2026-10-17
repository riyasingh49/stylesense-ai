import { GeminiClient } from "../gemini/gemini-client";
import { leadExtractionResponseSchema } from "../gemini/gemini-schemas";
import type { LeadExtractionProvider } from "./lead-extraction-provider";
import type {
  DiscoveredLeadCandidate,
  LeadSearchResult,
} from "../../types/lead-discovery";
import { LeadExtractionValidator } from "../../services/lead-extraction-validator";

export class GeminiLeadExtractionProvider
  implements LeadExtractionProvider
{
  constructor(
    private readonly geminiClient = new GeminiClient(),
    private readonly validator = new LeadExtractionValidator(),
  ) {}

  async extract(
    searchResults: LeadSearchResult[],
    limit: number,
  ): Promise<DiscoveredLeadCandidate[]> {
    if (searchResults.length === 0) {
      return [];
    }

    const prompt = JSON.stringify({
      task: "Extract potential B2B leads for StyleSense AI.",
      requestedLimit: limit,
      requirements: [
        "Identify people relevant to apparel, fashion, or retail businesses.",
        "Use only facts supported by the supplied search results.",
        "Do not invent names, job titles, company details, or email addresses.",
        "Set unavailable optional fields to null.",
        "Use the exact URL of the supplied search result supporting each candidate.",
        "Provide a short evidence excerpt supporting the person's role or company information.",
        "Return no more than the requested number of candidates.",
      ],
      searchResults: searchResults.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        publishedAt: result.publishedAt ?? null,
      })),
    });

    const generatedJson = await this.geminiClient.generateJson(
      prompt,
      leadExtractionResponseSchema,
    );

    return this.validator.validate(generatedJson, searchResults, limit);
  }
}