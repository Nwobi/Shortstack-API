import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerUser } from "../helpers";

describe("Auth API", () => {
  it("registers a user and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it("rejects duplicate email with 409", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "b@test.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "b@test.com", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "c@test.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "c@test.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
  });

  it("rejects wrong password with 401", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "d@test.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "d@test.com", password: "wrong" });
    expect(res.status).toBe(401);
  });
});

describe("Links API", () => {
  it("creates a short link and returns a short_url", async () => {
    const user = await registerUser();
    const res = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://example.com" });

    expect(res.status).toBe(201);
    expect(res.body.short_code).toHaveLength(7);
    expect(res.body.short_url).toContain(res.body.short_code);
  });

  it("creates a link with a custom alias", async () => {
    const user = await registerUser();
    const res = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://example.com", alias: "my-link" });

    expect(res.status).toBe(201);
    expect(res.body.alias).toBe("my-link");
    expect(res.body.short_url).toContain("my-link");
  });

  it("rejects a duplicate alias with 409", async () => {
    const user = await registerUser();
    await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://a.com", alias: "taken" });
    const res = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://b.com", alias: "taken" });
    expect(res.status).toBe(409);
  });

  it("rejects an invalid URL with 400", async () => {
    const user = await registerUser();
    const res = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "not-a-url" });
    expect(res.status).toBe(400);
  });

  it("lists all links for the user", async () => {
    const user = await registerUser();
    await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://a.com" });
    await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://b.com" });

    const res = await request(app)
      .get("/api/links")
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].total_clicks).toBe(0);
  });

  it("redirects to original URL on GET /:code", async () => {
    const user = await registerUser();
    const link = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://example.com" });

    const res = await request(app).get(`/${link.body.short_code}`).redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://example.com");
  });

  it("redirects using custom alias", async () => {
    const user = await registerUser();
    await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://example.com", alias: "go-here" });

    const res = await request(app).get("/go-here").redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://example.com");
  });

  it("returns 404 for unknown short codes", async () => {
    const res = await request(app).get("/zzzzzzz").redirects(0);
    expect(res.status).toBe(404);
  });

  it("returns 410 Gone for deactivated links", async () => {
    const user = await registerUser();
    const link = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://example.com" });

    await request(app)
      .patch(`/api/links/${link.body.id}/deactivate`)
      .set("Authorization", `Bearer ${user.token}`);

    const res = await request(app).get(`/${link.body.short_code}`).redirects(0);
    expect(res.status).toBe(410);
  });

  it("returns analytics with click counts and breakdowns", async () => {
    const user = await registerUser();
    const link = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://example.com" });

    // Generate some clicks
    await request(app).get(`/${link.body.short_code}`).redirects(0);
    await request(app).get(`/${link.body.short_code}`).redirects(0);

    // Wait for setImmediate click recording
    await new Promise((r) => setTimeout(r, 50));

    const res = await request(app)
      .get(`/api/links/${link.body.id}/analytics`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.total_clicks).toBe(2);
    expect(Array.isArray(res.body.browsers)).toBe(true);
    expect(Array.isArray(res.body.clicks_by_day)).toBe(true);
  });

  it("returns a QR code data URL", async () => {
    const user = await registerUser();
    const link = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://example.com" });

    const res = await request(app)
      .get(`/api/links/${link.body.id}/qr`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.qr_code).toMatch(/^data:image\/png;base64,/);
  });

  it("forbids another user from accessing analytics", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const link = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ url: "https://example.com" });

    const res = await request(app)
      .get(`/api/links/${link.body.id}/analytics`)
      .set("Authorization", `Bearer ${other.token}`);
    expect(res.status).toBe(403);
  });

  it("hard deletes a link", async () => {
    const user = await registerUser();
    const link = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ url: "https://example.com" });

    await request(app)
      .delete(`/api/links/${link.body.id}`)
      .set("Authorization", `Bearer ${user.token}`);

    const res = await request(app).get(`/${link.body.short_code}`).redirects(0);
    expect(res.status).toBe(404);
  });
});
