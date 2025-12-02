import { callVicidial } from "../services/vicidial.service.js";
import { parsePipeData } from "../utils/formatter.js";
import fs from "fs";
import path from "path";

function ensureDirExists(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const getCallReports = async (req, res) => {
    try {
        const { start_date, end_date, phone_number, type } = req.query;

        if (!phone_number && type === "inbound") {
            return res.status(400).json({ success: false, error: "phone_number required for inbound type" });
        }

        let raw;
        if (type === "inbound") {
            // VICIdial expects 'date' (single day) and 'phone_number'
            raw = await callVicidial("did_log_export", {
                phone_number,
                date: start_date, // only one day at a time
                user: process.env.VICIDIAL_USER,
                pass: process.env.VICIDIAL_PASS,
                stage: "pipe",
                header: "YES"
            });
        } else {
            // outbound or other stats
            raw = await callVicidial("call_status_stats", {
                start_date,
                end_date,
                user: process.env.VICIDIAL_USER,
                pass: process.env.VICIDIAL_PASS,
                stage: "pipe",
                header: "YES"
            });
        }

        const formatted = parsePipeData(raw);

        const dirPath = path.join(process.cwd(), "vicidial");
        ensureDirExists(dirPath);
        const filePath = path.join(dirPath, "call_reports.json");
        fs.writeFileSync(filePath, JSON.stringify(formatted, null, 2));

        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: err.toString() });
    }
};



// Get links (active campaigns connections)
export const getLinks = async (req, res) => {
    try {
        const raw = await callVicidial("user_group_status");
        const formatted = parsePipeData(raw);

        const dirPath = path.join(process.cwd(),"vicidial");
        ensureDirExists(dirPath);
        const filePath = path.join(dirPath, "links.json");
        fs.writeFileSync(filePath, JSON.stringify(formatted, null, 2));

        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: err.toString() });
    }
};
