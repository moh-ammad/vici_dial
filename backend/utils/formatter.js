export function parsePipeData(raw) {
    const lines = raw.trim().split("\n").filter(Boolean);

    const headers = lines[0].split("|");

    // If only one line => return single object
    if (lines.length === 2) {
        const values = lines[1].split("|");
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] || "");
        return obj;
    }

    // If multiple rows => return array
    const rows = lines.slice(1);
    return rows.map(line => {
        const f = line.split("|");
        const obj = {};
        headers.forEach((h, i) => obj[h] = f[i] || "");
        return obj;
    });
}
