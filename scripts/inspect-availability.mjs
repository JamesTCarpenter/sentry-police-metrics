const API_URL = "https://data.police.uk/api/crimes-street-dates";

const FORCE_ID = "metropolitan";

async function getAvailableMonths() {
  console.log("Connecting to Police.uk API...\n");

  try {
    const response = await fetch(API_URL, {
      signal: AbortSignal.timeout(30000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected API response: expected an array.");
    }

    const validEntries = data.filter((entry) => {
      return (
        entry &&
        typeof entry.date === "string" &&
        /^\d{4}-\d{2}$/.test(entry.date) &&
        Array.isArray(entry["stop-and-search"])
      );
    });

    if (validEntries.length !== data.length) {
      console.warn(
        `Warning: ${data.length - validEntries.length} invalid availability entries were ignored.`
      );
    }

    const metropolitanMonths = validEntries
      .filter((entry) => entry["stop-and-search"].includes(FORCE_ID))
      .map((entry) => entry.date)
      .sort();

    const uniqueMonths = [...new Set(metropolitanMonths)];

    console.log("METRICS — Data availability report");
    console.log("----------------------------------");
    console.log(`Force: ${FORCE_ID}`);
    console.log(`Available months: ${uniqueMonths.length}`);

    if (uniqueMonths.length === 0) {
      console.log("\nNo available months found.");
      return;
    }

    console.log(`First month: ${uniqueMonths[0]}`);
    console.log(`Latest month: ${uniqueMonths[uniqueMonths.length - 1]}`);

    console.log("\nAvailable months:\n");

    uniqueMonths.forEach((month) => {
      console.log(month);
    });

    console.log("\nAvailability check complete.");
  } catch (error) {
    console.error("\nFailed to retrieve availability data.");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

getAvailableMonths();
