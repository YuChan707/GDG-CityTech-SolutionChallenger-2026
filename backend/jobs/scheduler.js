// /jobs/scheduler.js

import cron from "node-cron";
import { runPipeline } from "../services/pipeline.service.js";

cron.schedule("0 */6 * * *", async () => {
  console.log("Running pipeline...");
  await runPipeline();
});