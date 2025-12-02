import { callVicidial } from "../services/vicidial.service.js";
import { parsePipeData } from "../utils/formatter.js";
import fs from "fs";
import path from "path";

function ensureDirExists(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const getDashboardData = async (req, res) => {
    try {
        const rawCampaigns = await callVicidial("campaigns_list");
        const campaigns = parsePipeData(rawCampaigns);

        const hopperPromises = campaigns.map(c =>
            callVicidial("hopper_list", { campaign_id: c.campaign_id })
                .then(parsePipeData)
                .catch(() => [])
        );
        const hopperData = await Promise.all(hopperPromises);

        const rawAgents = await callVicidial("logged_in_agents");
        const agents = parsePipeData(rawAgents);

        const activeCampaigns = campaigns.filter(c => c.active === "Y");
        const inactiveCampaigns = campaigns.filter(c => c.active !== "Y");

        const dashboardData = { campaigns, activeCampaigns, inactiveCampaigns, hopperData, agents };

        const dirPath = path.join(process.cwd(),"vicidial");
        ensureDirExists(dirPath);
        const filePath = path.join(dirPath, "dashboard.json");
        fs.writeFileSync(filePath, JSON.stringify(dashboardData, null, 2));

        res.json({ success: true, data: dashboardData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.toString() });
    }
};
