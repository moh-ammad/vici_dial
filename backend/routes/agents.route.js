import express from "express";
import { getAgentCampaigns, getSingleAgentStats, getAllAgentStats, getCampaignsDetailsBatch, getAgentsCampaignCounts, syncAllAgentsCampaigns } from "../controllers/agents.controller.js";

const router = express.Router();

router.get("/stats", getAllAgentStats);
router.get("/stats/single", getSingleAgentStats);
router.get("/campaigns", getAgentCampaigns);
router.get("/campaigns/details", getCampaignsDetailsBatch);
router.get("/campaigns/counts", getAgentsCampaignCounts);
router.post("/campaigns/sync-all", syncAllAgentsCampaigns);
router.get("/campaigns/sync-all", syncAllAgentsCampaigns); // Allow GET too for easy testing
export default router;
