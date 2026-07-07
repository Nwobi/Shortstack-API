import request from "supertest";
import { createApp } from "../src/app";

export const app = createApp();

let n = 0;
export async function registerUser(email?: string) {
  n += 1;
  const e = email ?? `user${n}@example.com`;
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: e, password: "password123" });
  return {
    token: res.body.token as string,
    userId: res.body.user.id as number,
    email: e,
  };
}
