const https = require("https");
const fs = require("fs");
const path = require("path");

// ------------------------------
// STEP 1: put all your list IDs here
const listIds = [204, 7242552, 7242553,998,1414,1022511,1042025,813251121,416250443]; // add more if needed

// STEP 2: array to store all list info
const allLists = [];

// ------------------------------
// Function to fetch info for one list
function getListInfo(listId, callback) {
    const url = `https://dialforge.ai/vicidial/non_agent_api.php?source=test&user=6666&pass=iConnect786&function=list_info&list_id=${listId}&leads_counts=Y&header=YES`;

    https.get(url, (res) => {
        let data = "";

        res.on("data", chunk => data += chunk);
        res.on("end", () => {
            if (data.startsWith("ERROR")) {
                console.error(`Error for list ${listId}:`, data);
                callback(null);
                return;
            }

            const lines = data.trim().split("\n");
            const headers = lines[0].split("|");
            const values = lines[1].split("|");

            const obj = {};
            headers.forEach((h, i) => obj[h] = values[i] || "");
            callback(obj);
        });

    }).on("error", err => {
        console.error("Request error:", err);
        callback(null);
    });
}

// ------------------------------
// Function to loop through all lists
function fetchAllLists(ids) {
    let index = 0;

    function next() {
        if (index >= ids.length) {
            // STEP 3: save all lists to JSON (Windows-friendly)
            const filePath = path.join(__dirname, "all_lists.json");
            fs.writeFileSync(filePath, JSON.stringify(allLists, null, 2));
            console.log(`All list info saved → ${filePath}`);
            return;
        }

        const listId = ids[index];
        getListInfo(listId, (obj) => {
            if (obj) allLists.push(obj);
            index++;
            next();
        });
    }

    next();
}

// ------------------------------
// START
fetchAllLists(listIds);
