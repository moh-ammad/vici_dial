import { callVicidial } from "../services/vicidial.service.js";
import { parsePipeData } from "../utils/formatter.js";
import fs from "fs";
import path from "path";

function ensureDirExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export const getListInfo = async (req, res) => {
    try {
        const { list_id } = req.query;

        const raw = await callVicidial("list_info", {
            list_id,
            header: "YES",
            leads_counts: "Y"
        });

        const formatted = parsePipeData(raw);

        // Correct folder path relative to project root
        const dirPath = path.join(process.cwd(),"vicidial");
        ensureDirExists(dirPath);

        const filePath = path.join(dirPath, "lists.json");
        fs.writeFileSync(filePath, JSON.stringify(formatted, null, 2));

        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: err.toString() });
    }
};
