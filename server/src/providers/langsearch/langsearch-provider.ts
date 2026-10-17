
import type { LeadSearchResult } from "../../types/lead-discovery";
import { LangSearchClient } from "./langsearch-client";

export interface LeadDiscoverySearchProvider {
  search(query: string, limit?: number): Promise<LeadSearchResult[]>;
}

export class LangSearchSearchProvider
  implements LeadDiscoverySearchProvider
{
  constructor(
    private readonly client: LangSearchClient = new LangSearchClient(),
  ) {}

  async search(
    query: string,
    limit = 10,
  ): Promise<LeadSearchResult[]> {
    return this.client.search(query, limit);
  }
}
