import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIRECTORY = path.join(process.cwd(), "data", "raw");

const EXPECTED_MONTHS = [
  "2023-09",
  "2023-10",
  "2023-11",
  "2023-12",
  "2024-01",
  "2024-02",
  "2024-03",
  "2024-04",
  "2024-05",
  "2024-06",
  "2024-07",
  "2024-08",
  "2024-09",
  "2024-10",
  "2024-11",
  "2024-12",
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
];

const REQUIRED_FILES = ["located.json", "unlocated.json"];

const DEMOGRAPHIC_FIELDS = [
  "age_range",
  "gender",
  "self_defined_ethnicity",
  "officer_defined_ethnicity",
  "outcome",
  "object_of_search",
];

function isMissing(value) {
  return value === null || value === undefined || value === "";
}

async function readJsonFile(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(contents);

  if (!Array.isArray(data)) {
    throw new Error("Expected a JSON array.");
  }

  return data;
}

function inspectRecords(records, source, month) {
  const report = {
    month,
    source,
    total: records.length,
    missingFields: {},
    missingCoordinates: 0,
    invalidCoordinates: 0,
    missingDatetime: 0,
    invalidDatetime: 0,
    missingLocationObject: 0,
  };

  for (const field of DEMOGRAPHIC_FIELDS) {
    report.missingFields[field] = 0;
  }

  for (const record of records) {
    if (!record || typeof record !== "object") {
      continue;
    }

    for (const field of DEMOGRAPHIC_FIELDS) {
      if (isMissing(record[field])) {
        report.missingFields[field]++;
      }
    }

    if (isMissing(record.datetime)) {
      report.missingDatetime++;
    } else if (Number.isNaN(Date.parse(record.datetime))) {
      report.invalidDatetime++;
    }

    if (source === "located") {
      if (!record.location) {
        report.missingLocationObject++;
        continue;
      }

      const latitude = Number(record.location.latitude);
      const longitude = Number(record.location.longitude);

      if (
        isMissing(record.location.latitude) ||
        isMissing(record.location.longitude)
      ) {
        report.missingCoordinates++;
      } else if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        report.invalidCoordinates++;
      }
    }
  }

  return report;
}

async function main() {
  console.log("\nMETRICS — Raw data validation");
  console.log("--------------------------------");

  const reports = [];
  const failures = [];

  for (const month of EXPECTED_MONTHS) {
    console.log(`Checking ${month}...`);

    const monthDirectory = path.join(DATA_DIRECTORY, month);

    for (const filename of REQUIRED_FILES) {
      const filePath = path.join(monthDirectory, filename);

      try {
        const records = await readJsonFile(filePath);

        const source = filename === "located.json" ? "located" : "unlocated";

        reports.push(inspectRecords(records, source, month));
      } catch (error) {
        failures.push({
          month,
          filename,
          error: error.message,
        });
      }
    }
  }

  const totals = {
    records: 0,
    located: 0,
    unlocated: 0,
    missingCoordinates: 0,
    invalidCoordinates: 0,
    missingDatetime: 0,
    invalidDatetime: 0,
    missingLocationObject: 0,
    missingFields: {},
  };

  for (const report of reports) {
    totals.records += report.total;

    if (report.source === "located") {
      totals.located += report.total;
    } else {
      totals.unlocated += report.total;
    }

    totals.missingCoordinates += report.missingCoordinates;
    totals.invalidCoordinates += report.invalidCoordinates;
    totals.missingDatetime += report.missingDatetime;
    totals.invalidDatetime += report.invalidDatetime;
    totals.missingLocationObject += report.missingLocationObject;

    for (const [field, count] of Object.entries(report.missingFields)) {
      totals.missingFields[field] = (totals.missingFields[field] || 0) + count;
    }
  }

  console.log("\n--------------------------------");
  console.log("VALIDATION SUMMARY");
  console.log("--------------------------------");

  console.log(`Months expected: ${EXPECTED_MONTHS.length}`);
  console.log(`Files successfully read: ${reports.length}`);
  console.log(`Files with errors: ${failures.length}`);
  console.log(`Total records: ${totals.records}`);
  console.log(`Located records: ${totals.located}`);
  console.log(`Unlocated records: ${totals.unlocated}`);

  console.log("\nMissing demographic and outcome fields:");

  for (const [field, count] of Object.entries(totals.missingFields)) {
    console.log(`  ${field}: ${count}`);
  }

  console.log("\nLocation checks:");
  console.log(`  Missing location objects: ${totals.missingLocationObject}`);
  console.log(`  Missing coordinates: ${totals.missingCoordinates}`);
  console.log(`  Invalid coordinates: ${totals.invalidCoordinates}`);

  console.log("\nDate checks:");
  console.log(`  Missing datetimes: ${totals.missingDatetime}`);
  console.log(`  Invalid datetimes: ${totals.invalidDatetime}`);

  if (failures.length > 0) {
    console.log("\nFile errors:");

    for (const failure of failures) {
      console.log(`  ${failure.month}/${failure.filename}: ${failure.error}`);
    }
  }

  const reportPath = path.join(process.cwd(), "data", "validation-report.json");

  await fs.writeFile(
    reportPath,
    JSON.stringify({ totals, reports, failures }, null, 2)
  );

  console.log(`\nDetailed report saved to: ${reportPath}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("\nValidation failed:", error.message);
  process.exitCode = 1;
});
