import { Parser } from "json2csv";
import fs from "fs";

export function exportCSV(results) {
    try {
        const parser = new Parser();
        const csv = parser.parse(results);
        fs.writeFileSync("results.csv", csv);
        console.log("results.csv created successfully.");
    } catch (err) {
        console.error("Error writing CSV:", err);
    }
}
