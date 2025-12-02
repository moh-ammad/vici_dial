const fs = require("fs");

// Load raw file from current folder
const rawFile = JSON.parse(fs.readFileSync("./raw_campaigns.json", "utf8"));

// Split lines, remove empty
const lines = rawFile.raw.trim().split("\n").map(l => l.trim()).filter(Boolean);

// Convert each row into a structured object
const campaigns = lines.map(line => {
    const f = line.split("|");

    return {
        campaign_id: f[0] || "",
        campaign_name: f[1] || "",
        active: f[2] || "",
        caller_id_name: f[3] || "",
        dial_method: f[4] || "",
        hopper_level: f[5] || "",
        next_agent_routing: f[6] || "",
        dial_status: f[7] || "",   // can be "NEW", "NEW NA DROP", etc.
        dial_timeout: f[8] || "",
        cid_override: f[9] || "",
        cid_alt: f[10] || ""
    };
});

// Save formatted output
fs.writeFileSync("./formatted_campaigns.json", JSON.stringify(campaigns, null, 2));

console.log("Formatted campaigns saved → formatted_campaigns.json");
