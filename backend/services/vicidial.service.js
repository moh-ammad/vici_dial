import https from "https";
import dotenv from "dotenv";
dotenv.config();

export function callVicidial(functionOrParams, params = {}) {
    return new Promise((resolve, reject) => {
        // Support two calling styles:
        // 1) callVicidial("function_name", { user, pass, ... })
        // 2) callVicidial({ function: "function_name", user, pass, ... })
        let fn = "";
        let p = {};

        if (typeof functionOrParams === "string") {
            fn = functionOrParams;
            p = params || {};
        } else if (typeof functionOrParams === "object") {
            p = functionOrParams || {};
            fn = p.function || "";
        } else {
            return reject(new Error("Invalid arguments to callVicidial"));
        }

        const user = p.user || process.env.VICIDIAL_USER;
        const pass = p.pass || process.env.VICIDIAL_PASS;

        // Build query object, exclude any duplicate keys from params
        const queryObj = {
            source: "node-api",
            user,
            pass,
            function: fn || p.function || "",
        };

        for (const k of Object.keys(p)) {
            if (k === "user" || k === "pass" || k === "function") continue;
            queryObj[k] = p[k];
        }

        // validate function present
        if (!queryObj.function) return reject(new Error("callVicidial: no function specified"));

        const query = new URLSearchParams(queryObj);

        const url = `${process.env.VICIDIAL_URL}?${query.toString()}`;


        https.get(url, res => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                if (typeof data === 'string' && data.startsWith("ERROR")) return reject(new Error(data));
                resolve(data);
            });
        }).on("error", err => reject(err));
    });
}

