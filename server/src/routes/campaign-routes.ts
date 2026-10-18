import { Router } from "express";
import { isDatabaseConfigured } from "../config/database";
import {
  CampaignRepositoryError,
  createCampaign,
  getCampaignById,
  listCampaigns,
  updateCampaign,
} from "../repositories/campaign-repository";
import {
  campaignIdSchema,
  createCampaignSchema,
  listCampaignsSchema,
  updateCampaignSchema,
} from "../schemas/campaign-schemas";

const campaignRouter = Router();

campaignRouter.get("/", async (req, res, next) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      error: "Database is not configured.",
    });
  }

  const parsed = listCampaignsSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid campaign filters.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await listCampaigns(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

campaignRouter.get("/:id", async (req, res, next) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      error: "Database is not configured.",
    });
  }

  const parsedId = campaignIdSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    return res.status(400).json({
      error: "Invalid campaign ID.",
    });
  }

  try {
    const campaign = await getCampaignById(parsedId.data);

    if (!campaign) {
      return res.status(404).json({
        error: "Campaign not found.",
      });
    }

    return res.status(200).json({ campaign });
  } catch (error) {
    return next(error);
  }
});

campaignRouter.post("/", async (req, res, next) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      error: "Database is not configured.",
    });
  }

  const parsed = createCampaignSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid campaign data.",
      details: parsed.error.flatten(),
    });
  }

  try {
    const campaign = await createCampaign(parsed.data);
    return res.status(201).json({ campaign });
  } catch (error) {
    return next(error);
  }
});

campaignRouter.patch("/:id", async (req, res, next) => {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      error: "Database is not configured.",
    });
  }

  const parsedId = campaignIdSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    return res.status(400).json({
      error: "Invalid campaign ID.",
    });
  }

  const parsedBody = updateCampaignSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Invalid campaign update.",
      details: parsedBody.error.flatten(),
    });
  }

  try {
    const campaign = await updateCampaign(parsedId.data, parsedBody.data);
    return res.status(200).json({ campaign });
  } catch (error) {
    if (error instanceof CampaignRepositoryError) {
      if (error.code === "CAMPAIGN_NOT_FOUND") {
        return res.status(404).json({ error: error.message });
      }

      return res.status(409).json({ error: error.message });
    }

    return next(error);
  }
});

export default campaignRouter;