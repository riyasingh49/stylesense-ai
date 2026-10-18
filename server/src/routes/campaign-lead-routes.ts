import { Router } from "express";
import { isDatabaseConfigured } from "../config/database";
import {
  CampaignLeadRepositoryError,
} from "../repositories/campaign-lead-repository";
import {
  CampaignLeadServiceError,
  assignCampaignLeads,
  getCampaignLeads,
} from "../services/campaign-lead-service";
import {
  assignCampaignLeadsSchema,
  campaignLeadParamsSchema,
} from "../schemas/campaign-lead-schemas";
const campaignLeadRouter = Router({ mergeParams: true });

const getCampaignId = (params: unknown): string | undefined => {
  if (typeof params !== "object" || params === null) {
    return undefined;
  }

  const value = (params as Record<string, unknown>)["campaignId"];

  return typeof value === "string" ? value : undefined;
};

campaignLeadRouter.get("/", async (req, res, next) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      error: "Database is not configured.",
    });
  }

  const parsedParams = campaignLeadParamsSchema.safeParse({
    campaignId: getCampaignId(req.params),
  });

  if (!parsedParams.success) {
    return res.status(400).json({
      error: "Invalid campaign ID.",
      details: parsedParams.error.flatten(),
    });
  }

  try {
    const result = await getCampaignLeads(parsedParams.data.campaignId);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof CampaignLeadServiceError) {
      if (error.code === "CAMPAIGN_NOT_FOUND") {
        return res.status(404).json({ error: error.message });
      }
    }

    if (error instanceof CampaignLeadRepositoryError) {
      return res.status(500).json({ error: error.message });
    }

    return next(error);
  }
});

campaignLeadRouter.post("/", async (req, res, next) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      error: "Database is not configured.",
    });
  }

  const parsedParams = campaignLeadParamsSchema.safeParse({
    campaignId: getCampaignId(req.params),
  });
  
  if (!parsedParams.success) {
    return res.status(400).json({
      error: "Invalid campaign ID.",
      details: parsedParams.error.flatten(),
    });
  }

  const parsedBody = assignCampaignLeadsSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Invalid campaign lead assignment.",
      details: parsedBody.error.flatten(),
    });
  }

  try {
    const result = await assignCampaignLeads(
      parsedParams.data.campaignId,
      parsedBody.data.lead_ids,
    );

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof CampaignLeadServiceError) {
      const status =
        error.code === "CAMPAIGN_NOT_FOUND" ||
        error.code === "LEAD_NOT_FOUND"
          ? 404
          : 409;

      return res.status(status).json({ error: error.message });
    }

    if (error instanceof CampaignLeadRepositoryError) {
      return res.status(500).json({ error: error.message });
    }

    return next(error);
  }
});

export default campaignLeadRouter;