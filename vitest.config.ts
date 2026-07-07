import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      DB_PATH: ":memory:",
      JWT_SECRET: "test-secret-key-vitest",
      BASE_URL: "http://localhost:3000",
      LOG_LEVEL: "silent",
      CACHE_MAX_SIZE: "100",
    },
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
  },
});
