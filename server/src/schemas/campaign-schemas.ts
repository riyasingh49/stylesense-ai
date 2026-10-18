import { z } from "zod";

export const campaignStatusSchema = z.enum([
  "draft",
  "scheduled",
  "sending",
  "paused",
  "completed",
  "failed",
]);

export const listCampaignsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: campaignStatusSchema.optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(200),
  email_body: z.string().trim().min(1).max(10000),
  scheduled_at: z.string().datetime({ offset: true }).nullable().optional(),
});

export const updateCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    subject: z.string().trim().min(1).max(200).optional(),
    email_body: z.string().trim().min(1).max(10000).optional(),
    scheduled_at: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

export const campaignIdSchema = z.string().uuid();