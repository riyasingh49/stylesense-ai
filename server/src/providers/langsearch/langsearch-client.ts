import {
    LeadDiscoveryError,
} from "../../errors/lead-discovery-error";

import type {
    LeadSearchResult,
} from "../../types/lead-discovery";

import type {
    LangSearchApiResponse,
    LangSearchWebPage,
} from "./langsearch-types";
import { env } from "../../config/env";

const LANGSEARCH_ENDPOINT =
    "https://api.langsearch.com/v1/web-search";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESULTS = 50;

export class LangSearchClient {
    async search(
        query: string,
        limit = 10,
    ): Promise<LeadSearchResult[]> {
        const apiKey = env.LANGSEARCH_API_KEY?.trim();

        if (!apiKey) {
            throw new LeadDiscoveryError(
                "LangSearch is not configured. Set LANGSEARCH_API_KEY in the server environment.",
                "NOT_CONFIGURED",
                503,
            );
        }

        const normalizedQuery = query.trim();

        if (!normalizedQuery) {
            throw new LeadDiscoveryError(
                "A non-empty search query is required.",
                "INVALID_REQUEST",
                400,
            );
        }

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > MAX_RESULTS
        ) {
            throw new LeadDiscoveryError(
                `Search limit must be an integer between 1 and ${MAX_RESULTS}.`,
                "INVALID_REQUEST",
                400,
            );
        }

        let response: Response;

        try {
            response = await fetch(LANGSEARCH_ENDPOINT, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: normalizedQuery,
                    count: limit,
                }),
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                (error.name === "TimeoutError" ||
                    error.name === "AbortError")
            ) {
                throw new LeadDiscoveryError(
                    "LangSearch request timed out. Please try again.",
                    "TIMEOUT",
                    504,
                );
            }

            throw new LeadDiscoveryError(
                "Could not connect to LangSearch.",
                "UPSTREAM_ERROR",
                502,
            );
        }

        if (response.status === 401 || response.status === 403) {
            throw new LeadDiscoveryError(
                "LangSearch rejected the API key. Check LANGSEARCH_API_KEY.",
                "UNAUTHORIZED",
                502,
            );
        }

        if (response.status === 429) {
            throw new LeadDiscoveryError(
                "LangSearch rate limit reached. Wait before trying again.",
                "RATE_LIMITED",
                429,
            );
        }

        if (!response.ok) {
            throw new LeadDiscoveryError(
                "LangSearch returned an unsuccessful response.",
                "UPSTREAM_ERROR",
                502,
            );
        }

        let payload: LangSearchApiResponse;

        try {
            payload =
                (await response.json()) as LangSearchApiResponse;
        } catch {
            throw new LeadDiscoveryError(
                "LangSearch returned an invalid JSON response.",
                "INVALID_RESPONSE",
                502,
            );
        }

        if (String(payload.code) !== "200") {
            throw new LeadDiscoveryError(
                "LangSearch could not complete the search request.",
                "UPSTREAM_ERROR",
                502,
            );
        }

        const pages = payload.data?.webPages?.value;

        if (!Array.isArray(pages)) {
            throw new LeadDiscoveryError(
                "LangSearch returned an unexpected response structure.",
                "INVALID_RESPONSE",
                502,
            );
        }


        return pages
            .filter(
                (page) =>
                    typeof page.name === "string" &&
                    typeof page.url === "string" &&
                    this.isHttpUrl(page.url),
            )
            .slice(0, limit)
            .map((page) => this.mapResult(page));
    }

    private mapResult(
        page: LangSearchWebPage,
    ): LeadSearchResult {
        const title = page.name as string;
        const url = page.url as string;

        const snippet =
            typeof page.snippet === "string"
                ? page.snippet
                : typeof page.text === "string"
                    ? page.text
                    : "";

        return {
            title,
            url,
            snippet,
            ...(typeof page.datePublished === "string"
                ? { publishedAt: page.datePublished }
                : {}),
        };
    }

    private isHttpUrl(value: string): boolean {
        try {
            const url = new URL(value);

            return (
                url.protocol === "http:" ||
                url.protocol === "https:"
            );
        } catch {
            return false;
        }
    }
}
