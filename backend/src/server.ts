import { env } from './config/env.js';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

async function bootstrap() {
  try {
    await connectDB();
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 BookLeaf API Server is running on port ${env.PORT}`);
      console.log(`📡 URL: http://localhost:${env.PORT}`);
      console.log(`🩺 Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`🤖 AI Model: ${env.GEMINI_MODEL}`);
      console.log(`=======================================================`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

bootstrap();
