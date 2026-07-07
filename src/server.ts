import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`ShortStack API running at ${env.BASE_URL} (${env.NODE_ENV})`);
  logger.info(`Redirect any short code: ${env.BASE_URL}/<code>`);
});
