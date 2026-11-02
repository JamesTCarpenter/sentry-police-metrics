import path from "node:path";
import Database from "better-sqlite3";

const db = new Database(path.join(process.cwd(), "data/metrics.db"), {
  readonly: true,
});

const boroughCounts = db
  .prepare(
    `
  SELECT
    borough_name,
    gss_code,
    COUNT(*) AS total_searches
  FROM stop_search_boroughs
  WHERE borough_name IS NOT NULL
  GROUP BY borough_name, gss_code
  ORDER BY total_searches DESC
`
  )
  .all();

const totals = db
  .prepare(
    `
  SELECT
    COUNT(*) AS total_assigned_rows,
    COUNT(borough_name) AS matched,
    COUNT(*) - COUNT(borough_name) AS unmatched
  FROM stop_search_boroughs
`
  )
  .get();

const unmatchedStats = db
  .prepare(
    `
  SELECT
    COUNT(*) AS total,
    MIN(latitude) AS min_latitude,
    MAX(latitude) AS max_latitude,
    MIN(longitude) AS min_longitude,
    MAX(longitude) AS max_longitude
  FROM stop_searches
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND id IN (
      SELECT stop_search_id
      FROM stop_search_boroughs
      WHERE borough_name IS NULL
    )
`
  )
  .get();

const unmatchedSamples = db
  .prepare(
    `
  SELECT
    s.id,
    s.latitude,
    s.longitude,
    s.street_name
  FROM stop_searches s
  INNER JOIN stop_search_boroughs b
    ON s.id = b.stop_search_id
  WHERE b.borough_name IS NULL
  LIMIT 10
`
  )
  .all();

console.log("\nOVERALL ASSIGNMENT TOTALS");
console.table(totals);

console.log("\nSEARCHES BY BOROUGH");
console.table(boroughCounts);

console.log("\nUNMATCHED COORDINATE RANGE");
console.table(unmatchedStats);

console.log("\nSAMPLE UNMATCHED RECORDS");
console.table(unmatchedSamples);

const unmatchedByBounds = db
  .prepare(
    `
    SELECT
      CASE
        WHEN latitude BETWEEN 51.2 AND 51.8
          AND longitude BETWEEN -0.6 AND 0.4
        THEN 'Inside provisional bounds'
        ELSE 'Outside provisional bounds'
      END AS geographic_group,
      COUNT(*) AS total
    FROM stop_searches s
    INNER JOIN stop_search_boroughs b
      ON s.id = b.stop_search_id
    WHERE b.borough_name IS NULL
    GROUP BY geographic_group
  `
  )
  .all();

console.log("\nUNMATCHED RECORDS BY GEOGRAPHIC AREA");
console.table(unmatchedByBounds);

const unmatchedLocations = db
  .prepare(
    `
    SELECT
      s.street_name,
      ROUND(s.latitude, 4) AS latitude,
      ROUND(s.longitude, 4) AS longitude,
      COUNT(*) AS total_searches
    FROM stop_searches s
    INNER JOIN stop_search_boroughs b
      ON s.id = b.stop_search_id
    WHERE b.borough_name IS NULL
      AND s.latitude BETWEEN 51.2 AND 51.8
      AND s.longitude BETWEEN -0.6 AND 0.4
    GROUP BY
      s.street_name,
      ROUND(s.latitude, 4),
      ROUND(s.longitude, 4)
    ORDER BY total_searches DESC
    LIMIT 20
  `
  )
  .all();

console.log("\nTOP UNMATCHED LOCATIONS INSIDE PROVISIONAL BOUNDS");
console.table(unmatchedLocations);

db.close();
