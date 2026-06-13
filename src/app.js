import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import apiRoutes from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(__dirname, "..", "web");

const app = express();

const getConfiguredOrigins = () => {
  return env.corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const isDevelopmentHost = (hostname) => {
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(hostname)) return true;
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  return /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
};

const isAllowedOrigin = (origin) => {
  const configuredOrigins = getConfiguredOrigins();
  if (!origin || origin === "null" || configuredOrigins.includes("*")) return true;
  if (configuredOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    return env.nodeEnv === "development" && isDevelopmentHost(url.hostname);
  } catch {
    return false;
  }
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "style-src": ["'self'", "https://cdnjs.cloudflare.com"],
        "font-src": ["'self'", "https://cdnjs.cloudflare.com", "data:"],
        "img-src": ["'self'", "data:"]
      }
    }
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "test") {
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
}

// API routes
app.use("/api", apiRoutes);

// Static frontend files
app.use(express.static(webDir));

// SPA fallback — serve index.html for any unmatched non-API path
app.get("*", (req, res) => {
  res.sendFile(path.join(webDir, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
