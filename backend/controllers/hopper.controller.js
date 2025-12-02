import { callVicidial } from "../services/vicidial.service.js";
import { parsePipeData } from "../utils/formatter.js";
import fs from "fs";
import path from "path";

function ensureDirExists(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const getHopperLeads = async (req, res) => {
    try {
        const {campaign_id } = req.query;
        if (!campaign_id) {
            return res.status(400).json({ success:false, error:"campaign_id required" });
        }

        const raw = await callVicidial("hopper_list", {
            source: "node-api",
            campaign_id,
            stage: "pipe",
            header: "YES"
        });

        const formatted = parsePipeData(raw);

        const dirPath = path.join(process.cwd(), "vicidial");
        ensureDirExists(dirPath);

        const filePath = path.join(dirPath, `hopper_${campaign_id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(formatted, null, 2));

        res.json({ success:true, data: formatted });
    } catch (err) {
        res.status(500).json({ success:false, error: err.toString() });
    }
};
