export interface LeadDiscoveryInput {
    industry: string;
    region: string;
    companySize?: string;
    jobTitles: string[];
    limit?: number;
}

export interface LeadSearchResult {
    title: string;
    url: string;
    snippet: string;
    publishedAt?: string;
}

export interface LeadSourceEvidence {
    url: string;
    title: string;
    excerpt: string;
    retrievedAt: string;
}

export interface DiscoveredLeadCandidate {
    firstName: string;
    lastName: string;
    email: string | null;
    jobTitle: string;
    companyName: string;
    companyIndustry: string | null;
    companyWebsite: string | null;
    linkedinUrl: string | null;
    sourceUrl: string;
    sourceEvidence: string;
}
