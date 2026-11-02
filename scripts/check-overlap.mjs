import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const RAW_DIRECTORY = path.join(process.cwd(), "data", "raw");

const months = (await fs.readdir(RAW_DIRECTORY))
  .filter((month) => /^\d{4}-\d{2}$/.test(month))
  .sort();

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const sortedKeys = Object.keys(value).sort();

    const entries = sortedKeys.map((key) => {
      return `${JSON.stringify(key)}:${stableStringify(value[key])}`;
    });

    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function fingerprint(record) {
  return createHash("sha256").update(stableStringify(record)).digest("hex");
}

async function main() {
  let locatedTotal = 0;
  let unlocatedTotal = 0;
  let locatedWithoutCoordinates = 0;
  let exactMatches = 0;

  for (const month of months) {
    const directory = path.join(RAW_DIRECTORY, month);

    const located = JSON.parse(
      await fs.readFile(path.join(directory, "located.json"), "utf8")
    );

    const unlocated = JSON.parse(
      await fs.readFile(path.join(directory, "unlocated.json"), "utf8")
    );

    locatedTotal += located.length;
    unlocatedTotal += unlocated.length;

    const locatedFingerprints = new Set();

    for (const record of located) {
      if (!record.location) {
        locatedWithoutCoordinates++;
      }

      locatedFingerprints.add(fingerprint(record));
    }

    for (const record of unlocated) {
      if (locatedFingerprints.has(fingerprint(record))) {
        exactMatches++;
      }
    }
  }

  console.log("\nMETRICS — Endpoint overlap check");
  console.log("--------------------------------");
  console.log(`Months checked: ${months.length}`);
  console.log(`Records in stops-force: ${locatedTotal}`);
  console.log(`Records in stops-no-location: ${unlocatedTotal}`);
  console.log(
    `stops-force records without location: ${locatedWithoutCoordinates}`
  );
  console.log(`Exact matches between endpoints: ${exactMatches}`);

  console.log("\nOverlap check complete.");
}

main().catch((error) => {
  console.error("Overlap check failed:", error.message);
  process.exitCode = 1;
});
