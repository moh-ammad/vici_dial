import express from "express";
import { getAgentCampaigns, getSingleAgentStats, getAllAgentStats, getCampaignsDetailsBatch, getAgentsCampaignCounts, syncAllAgentsCampaigns, getAgentCampaignsPagination, getAgentsPaginated } from "../controllers/agents.controller.js";

const router = express.Router();

// More specific routes MUST come before general ones
router.get("/stats/paginated", getAgentsPaginated);
router.get("/stats/single", getSingleAgentStats);
router.get("/stats", getAllAgentStats);
router.get("/campaigns/paginated", getAgentCampaignsPagination);
router.get("/campaigns/details", getCampaignsDetailsBatch);
router.get("/campaigns/counts", getAgentsCampaignCounts);
router.post("/campaigns/sync-all", syncAllAgentsCampaigns);
router.get("/campaigns/sync-all", syncAllAgentsCampaigns); // Allow GET too for easy testing
router.get("/campaigns", getAgentCampaigns);
export default router;
