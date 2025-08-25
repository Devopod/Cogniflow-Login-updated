import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger, requestLogger } from "./src/utils/logger";
import { env } from "./src/config";

const app = express();

// Trust proxy for secure cookies/HTTPS behind reverse proxies
app.set("trust proxy", 1);

// Basic security hardening
app.use(helmet({
  contentSecurityPolicy: false, // keep simple for MVP, avoid breaking frontend assets
}));

// CORS allowlist (env-driven)
const corsOrigin = env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Body parsers and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Structured request logger
app.use(requestLogger);

(async () => {
  const server = await registerRoutes(app);

  // Centralized error handler (don’t rethrow)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    logger.error({ err, status }, 'unhandled_error');
    res.status(status).json({ message });
  });

  // Setup dev/production static handling after routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info({ port }, 'server_listening');
  });
})();
