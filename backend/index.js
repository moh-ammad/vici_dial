import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import campaignRoutes from "./routes/campaigns.route.js";
import listRoutes from "./routes/lists.route.js";
import agentRoutes from "./routes/agents.route.js";
import hopperRoutes from "./routes/hopper.route.js";
import callsRoutes from "./routes/calls.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import "./cron/sync.cron.js"; // Enable auto-sync cron jobs

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => res.send("VICIdial API Connected ✔"));

app.use("/api/campaigns", campaignRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/hopper", hopperRoutes);
app.use("/api/calls", callsRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});