import { z } from "zod";
import { Router } from "express";
import type { Request, Response } from "express";
import { userRepo } from "../users/user.repository";
import {
  hashPassword,
  verifyPassword,
  signToken,
  ApiError,
  asyncHandler,
} from "../../utils/helpers";
import { requireAuth, validate } from "../../middleware/index";

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

const loginSchema = z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(1) }),
});

const authService = {
  async register(email: string, password: string) {
    if (userRepo.findByEmail(email))
      throw ApiError.conflict("Email already registered");
    const hash = await hashPassword(password);
    const user = userRepo.create(email, hash);
    return {
      token: signToken({ sub: String(user.id), email: user.email }),
      user: { id: user.id, email: user.email },
    };
  },
  async login(email: string, password: string) {
    const user = userRepo.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw ApiError.unauthorized("Invalid email or password");
    }
    return {
      token: signToken({ sub: String(user.id), email: user.email }),
      user: { id: user.id, email: user.email },
    };
  },
};

export const authRouter = Router();
authRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res
      .status(201)
      .json(await authService.register(req.body.email, req.body.password));
  }),
);
authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await authService.login(req.body.email, req.body.password));
  }),
);
authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  const user = userRepo.findById(Number(req.user!.sub));
  if (!user) throw ApiError.notFound();
  res.json({ id: user.id, email: user.email });
});
