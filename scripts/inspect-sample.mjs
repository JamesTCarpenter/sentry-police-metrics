const BASE_URL = "https://data.police.uk/api";
const FORCE_ID = "metropolitan";
const MONTH = "2026-07";

async function inspectEndpoint(name, url) {
  console.log(`\n--- ${name} ---`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `${name} failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(`${name}: expected an array.`);
  }

  console.log(`Records returned: ${data.length}`);

  if (data.length > 0) {
    console.log("\nExample record:");
    console.log(JSON.stringify(data[0], null, 2));
  }

  return data;
}

async function main() {
  try {
    const forceUrl = `${BASE_URL}/stops-force?date=${MONTH}&force=${FORCE_ID}`;

    const noLocationUrl = `${BASE_URL}/stops-no-location?date=${MONTH}&force=${FORCE_ID}`;

    console.log("METRICS — Sample data inspection");
    console.log("--------------------------------");
    console.log(`Force: ${FORCE_ID}`);
    console.log(`Month: ${MONTH}`);

    const locatedRecords = await inspectEndpoint(
      "Records with location",
      forceUrl
    );

    const unlocatedRecords = await inspectEndpoint(
      "Records without location",
      noLocationUrl
    );

    console.log("\n--- Summary ---");
    console.log(`Located records: ${locatedRecords.length}`);
    console.log(`Unlocated records: ${unlocatedRecords.length}`);
    console.log(
      `Combined records: ${locatedRecords.length + unlocatedRecords.length}`
    );
  } catch (error) {
    console.error("\nSample inspection failed:", error.message);
    process.exitCode = 1;
  }
}

main();
