import Database from "better-sqlite3";
import path from "node:path";

const DATABASE_PATH = path.join(process.cwd(), "data", "metrics.db");

const database = new Database(DATABASE_PATH, { readonly: true });

try {
  console.log("\nMETRICS — Database verification");
  console.log("--------------------------------");

  const total = database
    .prepare(
      `
    SELECT COUNT(*) AS count
    FROM stop_searches
  `
    )
    .get();

  console.log(`Total records: ${total.count}`);

  const sources = database
    .prepare(
      `
    SELECT source_type, COUNT(*) AS count
    FROM stop_searches
    GROUP BY source_type
  `
    )
    .all();

  console.log("\nRecords by source:");

  for (const source of sources) {
    console.log(`  ${source.source_type}: ${source.count}`);
  }

  const months = database
    .prepare(
      `
    SELECT
      source_month,
      COUNT(*) AS total,
      SUM(CASE WHEN source_type = 'located' THEN 1 ELSE 0 END) AS located,
      SUM(CASE WHEN source_type = 'unlocated' THEN 1 ELSE 0 END) AS unlocated
    FROM stop_searches
    GROUP BY source_month
    ORDER BY source_month
  `
    )
    .all();

  console.log(`\nMonths represented: ${months.length}`);

  const missing = database
    .prepare(
      `
    SELECT
      SUM(CASE WHEN age_range IS NULL THEN 1 ELSE 0 END) AS missing_age,
      SUM(CASE WHEN gender IS NULL THEN 1 ELSE 0 END) AS missing_gender,
      SUM(CASE WHEN self_defined_ethnicity IS NULL THEN 1 ELSE 0 END) AS missing_self_ethnicity,
      SUM(CASE WHEN officer_defined_ethnicity IS NULL THEN 1 ELSE 0 END) AS missing_officer_ethnicity,
      SUM(CASE WHEN outcome IS NULL THEN 1 ELSE 0 END) AS missing_outcome
    FROM stop_searches
  `
    )
    .get();

  console.log("\nMissing values:");
  console.log(missing);

  const coordinates = database
    .prepare(
      `
    SELECT
      source_type,
      COUNT(*) AS total,
  
      SUM(
        CASE WHEN latitude IS NULL THEN 1 ELSE 0 END
      ) AS missing_latitude,
  
      SUM(
        CASE WHEN longitude IS NULL THEN 1 ELSE 0 END
      ) AS missing_longitude,
  
      SUM(
        CASE
          WHEN latitude IS NULL OR longitude IS NULL
          THEN 1 ELSE 0
        END
      ) AS missing_coordinates,
  
      SUM(
        CASE
          WHEN latitude < -90 OR latitude > 90
            OR longitude < -180 OR longitude > 180
          THEN 1 ELSE 0
        END
      ) AS invalid_coordinates
  
    FROM stop_searches
    GROUP BY source_type
  `
    )
    .all();

  console.log("\nCoordinate integrity by source:");
  console.log(coordinates);

  const integrity = database.pragma("integrity_check");

  console.log("\nSQLite integrity check:");
  console.log(integrity);

  console.log("\nVerification complete.");

  if (total.count !== 369849 || months.length !== 34) {
    console.error("Unexpected record or month count.");
    process.exitCode = 1;
  }

  const locatedSource = coordinates.find(
    (item) => item.source_type === "located"
  );

  const unlocatedSource = coordinates.find(
    (item) => item.source_type === "unlocated"
  );

  if (
    !locatedSource ||
    !unlocatedSource ||
    locatedSource.missing_coordinates !== 0 ||
    locatedSource.invalid_coordinates !== 0 ||
    unlocatedSource.missing_coordinates !== unlocatedSource.total
  ) {
    console.error("Coordinate validation failed.");
    process.exitCode = 1;
  }

  if (integrity[0].integrity_check !== "ok") {
    console.error("SQLite integrity check failed.");
    process.exitCode = 1;
  }
} finally {
  database.close();
}
