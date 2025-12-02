import cron from "node-cron";
import { callVicidial } from "../services/vicidial.service.js";
import { parsePipeData } from "../utils/formatter.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VICI_DIR = path.join(__dirname, "..", "controllers", "vicidial");

if (!fs.existsSync(VICI_DIR)) fs.mkdirSync(VICI_DIR, { recursive: true });

// Sync all agents' campaigns every 30 minutes
cron.schedule("*/30 * * * *", async () => {
    console.log("🔄 Running auto-sync for all agents' campaigns...");
    
    try {
        // Get all agents
        const now = new Date();
        const past = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        const fmt = d => {
            const YYYY = d.getFullYear();
            const MM = String(d.getMonth() + 1).padStart(2, '0');
            const DD = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            return `${YYYY}-${MM}-${DD}+${hh}:${mm}:${ss}`;
        };

        const payload = {
            function: "agent_stats_export",
            source: "node-api",
            DB: "0",
            stage: "pipe",
            header: "YES",
            time_format: "HF",
            datetime_start: fmt(past),
            datetime_end: fmt(now),
        };

        const raw = await callVicidial(payload);
        const agentsList = parsePipeData(raw);
        const agents = Array.isArray(agentsList) ? agentsList : [agentsList];

        const results = {};
        let processed = 0;

        for (const agent of agents) {
            const agent_user = agent.user || agent.agent_user || agent.user_id;
            if (!agent_user) continue;

            try {
                const campRaw = await callVicidial("agent_campaigns", {
                    source: "node-api",
                    agent_user,
                    ignore_agentdirect: "N",
                    stage: "pipe",
                    header: "YES"
                });

                const rawTrim = String(campRaw || "").trim();
                if (!rawTrim || rawTrim.toUpperCase().startsWith("ERROR:")) {
                    results[agent_user] = { agent_user, campaigns: [], count_campaigns: 0 };
                    continue;
                }

                const lines = rawTrim.split(/\r?\n/).filter(Boolean);
                const dataLine = lines.length > 1 ? lines[1] : lines[0];

                let codes = [];
                if (dataLine.includes("|")) {
                    const parts = dataLine.split("|").map(p => p.trim());
                    if (parts[1]) codes = parts[1].split("-").map(c => c.trim()).filter(Boolean);
                } else if (dataLine.includes("-")) {
                    codes = dataLine.split("-").map(c => c.trim()).filter(Boolean);
                } else {
                    codes = [dataLine.trim()].filter(Boolean);
                }

                codes = Array.from(new Set(codes)).map(s => s.replace(/[\s\|,]/g, "")).filter(Boolean);
                const campaigns = codes.map(id => ({ id, name: id }));

                const formatted = {
                    agent_user,
                    agent_name: agent.full_name || agent.fullname || agent.name || null,
                    campaigns,
                    count_campaigns: campaigns.length,
                    last_synced: new Date().toISOString()
                };

                const safeAgent = String(agent_user).replace(/[^a-zA-Z0-9_-]/g, "_");
                const filePathAgent = path.join(VICI_DIR, `agent_campaigns_${safeAgent}.json`);
                fs.writeFileSync(filePathAgent, JSON.stringify(formatted, null, 2));

                results[agent_user] = formatted;
                processed++;

                if (processed % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (err) {
                console.error(`Error syncing agent ${agent_user}:`, err.message);
            }
        }

        const consolidatedPath = path.join(VICI_DIR, 'all_agents_campaigns.json');
        fs.writeFileSync(consolidatedPath, JSON.stringify(results, null, 2));

        const totalCampaigns = Object.values(results).reduce((sum, r) => sum + (r.count_campaigns || 0), 0);
        console.log(`✅ Synced campaigns for ${processed}/${agents.length} agents. Total: ${totalCampaigns} campaigns`);

    } catch (err) {
        console.error("❌ Error in campaign sync cron:", err);
    }
});

console.log("✅ Cron job scheduled: Sync all agents' campaigns every 30 minutes");
