import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

const geojson = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data/boundaries/london-boroughs.geojson"),
    "utf8"
  )
);

const boroughs = geojson.features;

const db = new Database(path.join(process.cwd(), "data/metrics.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS stop_search_boroughs (
    stop_search_id TEXT PRIMARY KEY,
    borough_name TEXT,
    gss_code TEXT,
    FOREIGN KEY (stop_search_id) REFERENCES stop_searches(id)
  );

  CREATE INDEX IF NOT EXISTS idx_borough_name
  ON stop_search_boroughs(borough_name);
`);

const records = db
  .prepare(
    `
  SELECT id, latitude, longitude
  FROM stop_searches
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
`
  )
  .all();

const insert = db.prepare(`
  INSERT OR REPLACE INTO stop_search_boroughs (
    stop_search_id,
    borough_name,
    gss_code
  )
  VALUES (?, ?, ?)
`);

const assignBoroughs = db.transaction(() => {
  let matched = 0;
  let unmatched = 0;

  for (const record of records) {
    const searchPoint = point([record.longitude, record.latitude]);

    let matchedBorough = null;

    for (const borough of boroughs) {
      if (booleanPointInPolygon(searchPoint, borough.geometry)) {
        matchedBorough = borough.properties;
        break;
      }
    }

    if (matchedBorough) {
      matched++;
    } else {
      unmatched++;
    }

    insert.run(
      record.id,
      matchedBorough?.name ?? null,
      matchedBorough?.gss_code ?? null
    );
  }

  return { matched, unmatched };
});

console.log(`Processing ${records.length.toLocaleString()} records...`);

const results = assignBoroughs();

console.log("Borough assignment complete.");
console.log("Matched:", results.matched.toLocaleString());
console.log("Unmatched:", results.unmatched.toLocaleString());

db.close();
