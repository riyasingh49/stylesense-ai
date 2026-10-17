import { Router } from "express";
import { z } from "zod";

import { validateRequest } from "../middleware/validate-request";
import { LeadDiscoveryError } from "../errors/lead-discovery-error";
import { LeadDiscoveryService } from "../services/lead-discovery-service";
import { sendError, sendSuccess } from "../utils/api-response";

const router = Router();
const leadDiscoveryService = new LeadDiscoveryService();

const discoverLeadsSchema = z.object({
  industry: z.string().trim().min(1).max(150),
  region: z.string().trim().min(1).max(150),
  companySize: z.string().trim().max(100).optional(),
  jobTitles: z
    .array(z.string().trim().min(1).max(150))
    .min(1)
    .max(10),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

router.post(
  "/search",
  validateRequest({ body: discoverLeadsSchema }),
  async (_req, res, next): Promise<void> => {
    try {
      const input = res.locals.validated?.body as z.infer<
        typeof discoverLeadsSchema
      >;

      const results = await leadDiscoveryService.discover(input);

      sendSuccess(res, {
        query: {
          industry: input.industry,
          region: input.region,
          companySize: input.companySize,
          jobTitles: input.jobTitles,
        },
        resultCount: results.length,
        results,
      });
    } catch (error: unknown) {
      if (error instanceof LeadDiscoveryError) {
        sendError(
          res,
          error.statusCode,
          error.code,
          error.message,
        );
        return;
      }

      next(error);
    }
  },
);

export { router as leadDiscoveryRouter };
