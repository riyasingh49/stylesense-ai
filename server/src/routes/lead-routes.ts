
import { Router } from "express";
import { z } from "zod";
import { isDatabaseConfigured } from "../config/database";
import { validateRequest } from "../middleware/validate-request";
import {
  createLead,
  getLeadById,
  listLeads,
} from "../repositories/lead-repository";
import { sendError, sendSuccess } from "../utils/api-response";

const router = Router();

const leadIdSchema = z.object({
  id: z.string().uuid("Lead ID must be a valid UUID."),
});

const listLeadsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  companyId: z.string().uuid().optional(),
  industry: z.string().trim().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(200).optional(),
});

const createLeadSchema = z.object({
  company_id: z.string().uuid("A valid company ID is required."),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(254),
  job_title: z.string().trim().max(150).optional(),
  linkedin_url: z.string().trim().url().optional(),
  source_url: z.string().trim().url().optional(),
});

router.get(
  "/",
  validateRequest({ query: listLeadsSchema }),
  async (_req, res, next): Promise<void> => {
    try {
      if (!isDatabaseConfigured()) {
        sendError(
          res,
          503,
          "DATABASE_NOT_CONFIGURED",
          "Lead data is unavailable until the database is configured.",
        );
        return;
      }

      const query = res.locals.validated?.query as z.infer<
        typeof listLeadsSchema
      >;

      const result = await listLeads({
        offset: (query.page - 1) * query.limit,
        limit: query.limit,
        companyId: query.companyId,
        industry: query.industry,
        search: query.search,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id",
  validateRequest({ params: leadIdSchema }),
  async (_req, res, next): Promise<void> => {
    try {
      if (!isDatabaseConfigured()) {
        sendError(
          res,
          503,
          "DATABASE_NOT_CONFIGURED",
          "Lead data is unavailable until the database is configured.",
        );
        return;
      }

      const { id } = res.locals.validated?.params as z.infer<
        typeof leadIdSchema
      >;

      const lead = await getLeadById(id);

      if (!lead) {
        sendError(res, 404, "LEAD_NOT_FOUND", "The requested lead was not found.");
        return;
      }

      sendSuccess(res, lead);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/",
  validateRequest({ body: createLeadSchema }),
  async (_req, res, next): Promise<void> => {
    try {
      if (!isDatabaseConfigured()) {
        sendError(
          res,
          503,
          "DATABASE_NOT_CONFIGURED",
          "Lead data cannot be saved until the database is configured.",
        );
        return;
      }

      const input = res.locals.validated?.body as z.infer<
        typeof createLeadSchema
      >;

      const lead = await createLead({
        company_id: input.company_id,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        job_title: input.job_title,
        linkedin_url: input.linkedin_url,
        source_url: input.source_url,
        discovery_method: "manual",
      });
      
      sendSuccess(res, lead, 201);
    } catch (error) {
      next(error);
    }
  },
);

export { router as leadRouter };
