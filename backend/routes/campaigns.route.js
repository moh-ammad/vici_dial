import express from "express";
import { getCampaigns } from "../controllers/campaigns.controller.js";

const router = express.Router();
router.get("/", getCampaigns);
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const campaigns = JSON.parse(fs.readFileSync(path.join(process.cwd(), "vicidial/campaigns.json")));
    const campaign = campaigns.find(c => c.campaign_id === id);
    if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });
    res.json({ success: true, data: campaign });
});


export default router;
