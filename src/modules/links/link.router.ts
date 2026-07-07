import { Router } from "express";
import type { Request, Response } from "express";
import {
  linkService,
  createLinkSchema,
  analyticsQuerySchema,
} from "./link.service";
import { requireAuth, validate, parseIdParam } from "../../middleware/index";
import { asyncHandler } from "../../utils/helpers";

function uid(req: Request) {
  return Number(req.user!.sub);
}

export const linkRouter = Router();
linkRouter.use(requireAuth);

// Create a short link
linkRouter.post(
  "/",
  validate(createLinkSchema),
  (req: Request, res: Response) => {
    const link = linkService.create(uid(req), req.body);
    res.status(201).json(link);
  },
);

// List all links for the current user
linkRouter.get("/", (req: Request, res: Response) => {
  res.json(linkService.listForUser(uid(req)));
});

// Get analytics for a link
linkRouter.get(
  "/:id/analytics",
  validate(analyticsQuerySchema),
  (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    const q = req.validatedQuery as { period: "24h" | "7d" | "30d" };
    res.json(linkService.getAnalytics(uid(req), id, q.period));
  },
);

// Get QR code for a link
linkRouter.get(
  "/:id/qr",
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    const dataUrl = await linkService.getQRCode(uid(req), id);
    res.json({ qr_code: dataUrl });
  }),
);

// Deactivate a link (soft delete, keeps analytics)
linkRouter.patch("/:id/deactivate", (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  linkService.deactivate(uid(req), id);
  res.json({ message: "Link deactivated" });
});

// Hard delete a link
linkRouter.delete("/:id", (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  linkService.delete(uid(req), id);
  res.status(204).send();
});
