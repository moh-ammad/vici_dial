const fs = require("fs");

/**
 * UNIVERSAL VICIDIAL PARSER
 * Converts any RAW NON-AGENT API response into an array of objects.
 */
function parseVici(rawString) {
    // Normalize
    rawString = rawString.trim();

    // Split into lines
    const lines = rawString.split("\n").map(x => x.trim()).filter(Boolean);

    // Convert each line into object
    return lines.map(line => {
        const fields = line.split("|");
        const obj = {};

        fields.forEach((value, index) => {
            obj[`field_${index+1}`] = value;
        });

        return obj;
    });
}

/**
 * Load from raw JSON file generated earlier
 * and save formatted JSON automatically.
 */
function processFile(rawPath, outputPath) {
    const rawFile = JSON.parse(fs.readFileSync(rawPath, "utf8"));
    const parsed = parseVici(rawFile.raw);
    fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
    console.log(`Saved → ${outputPath}`);
}

// Export for reuse
module.exports = { parseVici, processFile };
