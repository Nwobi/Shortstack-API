import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Request, Response, NextFunction, RequestHandler } from "express";

// ─── ApiError ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
  static badRequest(msg: string, details?: unknown) {
    return new ApiError(400, "BAD_REQUEST", msg, details);
  }
  static unauthorized(msg = "Authentication required") {
    return new ApiError(401, "UNAUTHORIZED", msg);
  }
  static forbidden(msg = "Access denied") {
    return new ApiError(403, "FORBIDDEN", msg);
  }
  static notFound(msg = "Not found") {
    return new ApiError(404, "NOT_FOUND", msg);
  }
  static conflict(msg: string) {
    return new ApiError(409, "CONFLICT", msg);
  }
  static gone(msg: string) {
    return new ApiError(410, "GONE", msg);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  sub: string;
  email: string;
}

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

// ─── asyncHandler ─────────────────────────────────────────────────────────────

type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;
export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next);
}
