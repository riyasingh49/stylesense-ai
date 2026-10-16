import { Router } from "express";
import { z } from "zod";
import { isDatabaseConfigured } from "../config/database";
import { validateRequest } from "../middleware/validate-request";
import {
  createCompany,
  getCompanyById,
  listCompanies,
} from "../repositories/company-repository";
import { sendError, sendSuccess } from "../utils/api-response";

const router = Router();

const companyIdSchema = z.object({
  id: z.string().uuid("Company ID must be a valid UUID."),
});

const listCompaniesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  industry: z.string().trim().min(1).max(100).optional(),
});

const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: z.string().trim().url().optional().or(z.literal("")),
  industry: z.string().trim().max(100).optional(),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(200).optional(),
});

router.get(
  "/",
  validateRequest({ query: listCompaniesSchema }),
  async (_req, res, next): Promise<void> => {
    try {
      if (!isDatabaseConfigured()) {
        sendError(
          res,
          503,
          "DATABASE_NOT_CONFIGURED",
          "Company data is unavailable until the database is configured.",
        );
        return;
      }

      const query = res.locals.validated?.query as z.infer<
        typeof listCompaniesSchema
      >;

      const result = await listCompanies({
        offset: (query.page - 1) * query.limit,
        limit: query.limit,
        industry: query.industry,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id",
  validateRequest({ params: companyIdSchema }),
  async (_req, res, next): Promise<void> => {
    try {
      if (!isDatabaseConfigured()) {
        sendError(
          res,
          503,
          "DATABASE_NOT_CONFIGURED",
          "Company data is unavailable until the database is configured.",
        );
        return;
      }

      const { id } = res.locals.validated?.params as z.infer<
        typeof companyIdSchema
      >;

      const company = await getCompanyById(id);

      if (!company) {
        sendError(
          res,
          404,
          "COMPANY_NOT_FOUND",
          "The requested company was not found.",
        );
        return;
      }

      sendSuccess(res, company);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/",
  validateRequest({ body: createCompanySchema }),
  async (_req, res, next): Promise<void> => {
    try {
      if (!isDatabaseConfigured()) {
        sendError(
          res,
          503,
          "DATABASE_NOT_CONFIGURED",
          "Company data cannot be saved until the database is configured.",
        );
        return;
      }

      const input = res.locals.validated?.body as z.infer<
        typeof createCompanySchema
      >;

      const company = await createCompany({
        name: input.name,
        website: input.website || undefined,
        industry: input.industry,
        description: input.description,
        location: input.location,
      });

      sendSuccess(res, company, 201);
    } catch (error) {
      next(error);
    }
  },
);

export { router as companyRouter };
