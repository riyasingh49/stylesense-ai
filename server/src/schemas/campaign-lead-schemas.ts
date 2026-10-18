import { z } from "zod";

export const assignCampaignLeadsSchema = z
  .object({
    lead_ids: z
      .array(z.string().uuid())
      .min(1, "Select at least one lead.")
      .max(500, "A maximum of 500 leads can be assigned at once."),
  })
  .refine((data) => new Set(data.lead_ids).size === data.lead_ids.length, {
    message: "Duplicate lead IDs are not allowed.",
    path: ["lead_ids"],
  });

export const campaignLeadParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const campaignLeadDetailParamsSchema = z.object({
  campaignId: z.string().uuid(),
  campaignLeadId: z.string().uuid(),
});