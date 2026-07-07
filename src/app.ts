import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./modules/auth/index";
import { linkRouter } from "./modules/links/link.router";
import { linkService } from "./modules/links/link.service";
import { errorHandler, notFoundHandler } from "./middleware/index";
import { env } from "./config/env";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Health check
  app.get("/health", (_req, res) =>
    res.json({ status: "ok", uptime: process.uptime() }),
  );

  // REST API
  app.use("/api/auth", authRouter);
  app.use("/api/links", linkRouter);

  /**
   * Redirect handler — /:code is the hot path.
   * Mounted last so it doesn't shadow /api/* or /health routes.
   * Uses 302 (temporary) so browsers don't cache the redirect and
   * we continue to capture clicks on every visit.
   */
  app.get("/:code", (req: Request, res: Response) => {
    try {
      const code = Array.isArray(req.params.code)
        ? req.params.code[0]!
        : req.params.code!;
      const originalUrl = linkService.resolve(code, {
        userAgent: req.get("user-agent"),
        referrer: req.get("referer"),
        acceptLanguage: req.get("accept-language"),
      });
      res.redirect(302, originalUrl);
    } catch (err) {
      // Forward to error handler
      throw err;
    }
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
