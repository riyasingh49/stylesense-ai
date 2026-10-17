export type LeadDiscoveryErrorCode =
  | "NOT_CONFIGURED"
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

export class LeadDiscoveryError extends Error {
  constructor(
    message: string,
    public readonly code: LeadDiscoveryErrorCode,
    public readonly statusCode: number,
  ) {
    super(message);

    this.name = "LeadDiscoveryError";

    Object.setPrototypeOf(this, LeadDiscoveryError.prototype);
  }
}
