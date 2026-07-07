import type { TokenPayload } from "../utils/helpers";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      validatedQuery?: Record<string, unknown>;
    }
  }
}
export {};
