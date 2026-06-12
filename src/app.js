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
    origin: env.corsOrigin === "*" ? true : env.corsOrigin,
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
