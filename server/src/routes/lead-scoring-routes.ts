import { Router } from "express";
import { z } from "zod";
import { isDatabaseConfigured } from "../config/database";
import { validateRequest } from "../middleware/validate-request";
import { listLeadScoreHistory } from "../repositories/lead-scoring-repository";
import {
  LeadScoringOrchestrationError,
  scoreLead,
} from "../services/lead-scoring-orchestration-service";
import { sendError, sendSuccess } from "../utils/api-response";

const router = Router();

const leadIdSchema = z.object({
  id: z.string().uuid("Lead ID must be a valid UUID."),
});

const scoreLeadSchema = z.object({
  targetIndustry: z.string().trim().min(1).max(100).optional(),
  companyIndustry: z.string().trim().min(1).max(100).optional(),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.post(
  "/:id/score",
  validateRequest({
    params: leadIdSchema,
    body: scoreLeadSchema,
  }),
  async (_req, res, next): Promise<void> => {
    try {
      if (!isDatabaseConfigured()) {
        sendError(
          res,
          503,
          "DATABASE_NOT_CONFIGURED",
          "Lead scoring is unavailable until the database is configured.",
        );
        return;
      }

      const { id } = res.locals.validated?.params as z.infer<
        typeof leadIdSchema
      >;

      const input = res.locals.validated?.body as z.infer<
        typeof scoreLeadSchema
      >;

      const result = await scoreLead(id, input);

      sendSuccess(res, result);
    } catch (error) {
      if (error instanceof LeadScoringOrchestrationError) {
        const status = error.code === "LEAD_NOT_FOUND" ? 404 : 500;

        sendError(res, status, error.code, error.message);
        return;
      }

      next(error);
    }
  },
);

router.get(
  "/:id/score-history",
  validateRequest({
    params: leadIdSchema,
    query: historyQuerySchema,
  }),
  async (_req, res, next): Promise<void> => {
    try {
      if (!isDatabaseConfigured()) {
        sendError(
          res,
          503,
          "DATABASE_NOT_CONFIGURED",
          "Score history is unavailable until the database is configured.",
        );
        return;
      }

      const { id } = res.locals.validated?.params as z.infer<
        typeof leadIdSchema
      >;

      const { limit } = res.locals.validated?.query as z.infer<
        typeof historyQuerySchema
      >;

      const history = await listLeadScoreHistory(id, limit);

      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  },
);

export { router as leadScoringRouter };
