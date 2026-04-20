import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import eventsRouter          from "./routes/events.js";
import businessesRouter      from "./routes/businesses.js";
import recommendationsRouter from "./routes/recommendations.js";
import dailyPickRouter       from "./routes/daily-pick.js";
import pipelineRouter        from "./routes/pipeline.js";
import educationRouter       from "./routes/education.js";
import './jobs/scheduler.js'; 
import { runStartupChecks } from "./services/startup-check.service.js";
import { globalLimiter, recommendationsLimiter } from "./config/rateLimiter.js";

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: "10kb" }));
app.use(globalLimiter);

app.use("/api/events",     eventsRouter);
app.use("/api/businesses", businessesRouter);
app.use("/api/recommendations", recommendationsLimiter, recommendationsRouter);
app.use("/api/daily-pick", dailyPickRouter);
app.use("/api/pipeline",   pipelineRouter);
app.use("/api/education",  educationRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Explore NYC API" });
});

app.listen(PORT, () => {
  console.log(`Explore NYC API running on http://localhost:${PORT}`);
  // Non-blocking — never delays startup
  runStartupChecks().catch(err =>
    console.error('[server] startup checks failed:', err.message)
  );
});
