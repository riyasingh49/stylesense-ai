import type {
    LeadDiscoveryInput,
    LeadSearchResult,
} from "../types/lead-discovery";

import {
    LangSearchSearchProvider,
    type LeadDiscoverySearchProvider,
} from "../providers/langsearch/langsearch-provider";

export class LeadDiscoveryService {
    constructor(
        private readonly searchProvider: LeadDiscoverySearchProvider =
            new LangSearchSearchProvider(),
    ) { }

    async discover(
        input: LeadDiscoveryInput,
    ): Promise<LeadSearchResult[]> {
        const normalizedInput = this.validateInput(input);
        const query = this.buildSearchQuery(normalizedInput);

        return this.searchProvider.search(
            query,
            normalizedInput.limit ?? 10,
        );
    }

    private validateInput(
        input: LeadDiscoveryInput,
    ): LeadDiscoveryInput {
        if (!input.industry?.trim()) {
            throw new Error("Industry is required.");
        }

        if (!input.region?.trim()) {
            throw new Error("Region is required.");
        }

        if (
            !Array.isArray(input.jobTitles) ||
            input.jobTitles.length === 0 ||
            input.jobTitles.some(
                (title) => typeof title !== "string" || !title.trim(),
            )
        ) {
            throw new Error(
                "At least one valid target job title is required.",
            );
        }

        const limit = input.limit ?? 10;

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 50
        ) {
            throw new Error(
                "Limit must be an integer between 1 and 50.",
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

    private buildSearchQuery(
        input: LeadDiscoveryInput,
    ): string {
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
