import fs from "node:fs/promises";
import path from "node:path";

const API_BASE_URL = "https://data.police.uk/api";

const FORCE_ID = "metropolitan";

const DATA_DIRECTORY = path.join(process.cwd(), "data", "raw");

const REQUEST_TIMEOUT = 30000;

async function getAvailableMonths() {
  console.log("Retrieving available months...");

  const response = await fetch(`${API_BASE_URL}/crimes-street-dates`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Availability request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid availability response.");
  }

  const months = data
    .filter((entry) => {
      return (
        entry &&
        typeof entry.date === "string" &&
        /^\d{4}-(0[1-9]|1[0-2])$/.test(entry.date) &&
        Array.isArray(entry["stop-and-search"])
      );
    })
    .filter((entry) => {
      return entry["stop-and-search"].includes(FORCE_ID);
    })
    .map((entry) => entry.date);

  const uniqueMonths = [...new Set(months)].sort();

  if (uniqueMonths.length === 0) {
    throw new Error(`No available months found for ${FORCE_ID}.`);
  }

  console.log(`Found ${uniqueMonths.length} available months.`);

  return uniqueMonths;
}

async function fetchStopRecords(url, description) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`  Fetching ${description}...`);

      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Expected an array of records.");
      }

      return data;
    } catch (error) {
      console.error(
        `  Attempt ${attempt}/${maxAttempts} failed: ${error.message}`
      );

      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = 1000 * 2 ** (attempt - 1);

      console.log(`  Retrying in ${delay / 1000} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function downloadMonth(month) {
  console.log(`\nProcessing ${month}`);

  const monthDirectory = path.join(DATA_DIRECTORY, month);

  await fs.mkdir(monthDirectory, {
    recursive: true,
  });

  const locatedUrl = `${API_BASE_URL}/stops-force?date=${month}&force=${FORCE_ID}`;

  const unlocatedUrl = `${API_BASE_URL}/stops-no-location?date=${month}&force=${FORCE_ID}`;

  const locatedRecords = await fetchStopRecords(locatedUrl, "located records");

  const unlocatedRecords = await fetchStopRecords(
    unlocatedUrl,
    "unlocated records"
  );

  await fs.writeFile(
    path.join(monthDirectory, "located.json"),
    JSON.stringify(locatedRecords, null, 2)
  );

  await fs.writeFile(
    path.join(monthDirectory, "unlocated.json"),
    JSON.stringify(unlocatedRecords, null, 2)
  );

  console.log(`  Located: ${locatedRecords.length}`);
  console.log(`  Unlocated: ${unlocatedRecords.length}`);
  console.log(`  Total: ${locatedRecords.length + unlocatedRecords.length}`);

  return {
    month,
    located: locatedRecords.length,
    unlocated: unlocatedRecords.length,
  };
}

async function main() {
  console.log("\nMETRICS — Stop & Search ingestion");
  console.log("--------------------------------");

  const months = await getAvailableMonths();

  console.log("\nMonths scheduled for ingestion:");

  months.forEach((month) => {
    console.log(`- ${month}`);
  });

  await fs.mkdir(DATA_DIRECTORY, {
    recursive: true,
  });

  console.log("\nStarting monthly downloads...");

  const results = [];

  for (const month of months) {
    try {
      const result = await downloadMonth(month);
      results.push(result);
    } catch (error) {
      console.error(`\nFailed to process ${month}: ${error.message}`);
      console.error("Continuing with the next month...");
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n--------------------------------");
  console.log("INGESTION SUMMARY");
  console.log("--------------------------------");

  const totalLocated = results.reduce((total, item) => total + item.located, 0);

  const totalUnlocated = results.reduce(
    (total, item) => total + item.unlocated,
    0
  );

  console.log(`Successful months: ${results.length}/${months.length}`);
  console.log(`Located records: ${totalLocated}`);
  console.log(`Unlocated records: ${totalUnlocated}`);
  console.log(`Combined records: ${totalLocated + totalUnlocated}`);

  if (results.length !== months.length) {
    console.error("\nSome months failed and will need to be retried.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("\nIngestion setup failed:");
  console.error(error.message);
  process.exitCode = 1;
});
