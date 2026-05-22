import { env } from './config/env.js';
import { connectDB } from './lib/mongoose.js';
import { logger } from './lib/logger.js';
import app from './app.js';

async function main() {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`Travanora API running on http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
