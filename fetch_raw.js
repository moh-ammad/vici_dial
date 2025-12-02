const fs = require('fs');
const https = require('https');

const url = "https://dialforge.ai/vicidial/non_agent_api.php?source=test&user=6666&pass=iConnect786&function=campaigns_list";

https.get(url, (res) => {
    let data = "";

    res.on("data", chunk => data += chunk);
    res.on("end", () => {
        const outputPath = "./raw_campaigns.json";
        fs.writeFileSync(outputPath, JSON.stringify({ raw: data }, null, 2));
        console.log("Saved raw data →", outputPath);
    });

}).on("error", (err) => {
    console.error("Request error:", err);
});
