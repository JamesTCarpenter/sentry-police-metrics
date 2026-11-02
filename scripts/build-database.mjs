import Database from "better-sqlite3";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const PROJECT_DIRECTORY = process.cwd();

const RAW_DIRECTORY = path.join(PROJECT_DIRECTORY, "data", "raw");

const DATABASE_DIRECTORY = path.join(PROJECT_DIRECTORY, "data");

const DATABASE_PATH = path.join(DATABASE_DIRECTORY, "metrics.db");

const SCHEMA_PATH = path.join(PROJECT_DIRECTORY, "database", "schema.sql");

const SOURCES = [
  {
    name: "stops-force",
    filename: "located.json",
  },
];

async function initialiseDatabase() {
  await fs.mkdir(DATABASE_DIRECTORY, {
    recursive: true,
  });

  const database = new Database(DATABASE_PATH);

  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  const schema = await fs.readFile(SCHEMA_PATH, "utf8");

  database.exec(schema);

  console.log("SQLite database initialised.");

  return database;
}

function generateRecordId(month, source, index) {
  const identifier = `${month}:${source}:${index}`;

  return createHash("sha256").update(identifier).digest("hex");
}

function toBooleanInteger(value) {
  if (value === true) return 1;
  if (value === false) return 0;
  return null;
}

function mapRecord(record, month, index) {
  const latitude = record.location?.latitude;
  const longitude = record.location?.longitude;

  const hasCoordinates =
    latitude != null &&
    longitude != null &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude));

  const sourceType = hasCoordinates ? "located" : "unlocated";

  return {
    id: generateRecordId(month, "stops-force", index),

    source_month: month,
    source_type: sourceType,

    datetime: record.datetime ?? null,
    age_range: record.age_range ?? null,
    gender: record.gender ?? null,

    self_defined_ethnicity: record.self_defined_ethnicity ?? null,

    officer_defined_ethnicity: record.officer_defined_ethnicity ?? null,

    outcome: record.outcome || null,
    outcome_id: record.outcome_object?.id ?? null,

    object_of_search: record.object_of_search ?? null,
    legislation: record.legislation ?? null,
    search_type: record.type ?? null,

    involved_person: toBooleanInteger(record.involved_person),
    operation: toBooleanInteger(record.operation),

    operation_name: record.operation_name ?? null,

    outcome_linked_to_object_of_search: toBooleanInteger(
      record.outcome_linked_to_object_of_search
    ),

    removal_of_more_than_outer_clothing: toBooleanInteger(
      record.removal_of_more_than_outer_clothing
    ),

    latitude: latitude == null ? null : Number(latitude),
    longitude: longitude == null ? null : Number(longitude),

    street_id: record.location?.street?.id ?? null,
    street_name: record.location?.street?.name ?? null,
  };
}

const INSERT_SQL = `
INSERT OR IGNORE INTO stop_searches (
  id,
  source_month,
  source_type,
  datetime,
  age_range,
  gender,
  self_defined_ethnicity,
  officer_defined_ethnicity,
  outcome,
  outcome_id,
  object_of_search,
  legislation,
  search_type,
  involved_person,
  operation,
  operation_name,
  outcome_linked_to_object_of_search,
  removal_of_more_than_outer_clothing,
  latitude,
  longitude,
  street_id,
  street_name
) VALUES (
  @id,
  @source_month,
  @source_type,
  @datetime,
  @age_range,
  @gender,
  @self_defined_ethnicity,
  @officer_defined_ethnicity,
  @outcome,
  @outcome_id,
  @object_of_search,
  @legislation,
  @search_type,
  @involved_person,
  @operation,
  @operation_name,
  @outcome_linked_to_object_of_search,
  @removal_of_more_than_outer_clothing,
  @latitude,
  @longitude,
  @street_id,
  @street_name
)
`;

async function importMonth(database, month, insertRecord) {
  console.log(`\nImporting ${month}...`);

  const monthDirectory = path.join(RAW_DIRECTORY, month);

  let monthTotal = 0;

  for (const source of SOURCES) {
    const filePath = path.join(monthDirectory, source.filename);

    const contents = await fs.readFile(filePath, "utf8");
    const records = JSON.parse(contents);

    if (!Array.isArray(records)) {
      throw new Error(`${month}/${source.filename} is not an array.`);
    }

    const importRecords = database.transaction(() => {
      let inserted = 0;

      records.forEach((record, index) => {
        if (!record || typeof record !== "object") {
          throw new Error(
            `Invalid record at index ${index} in ${month}/${source.filename}`
          );
        }

        const mappedRecord = mapRecord(record, month, index);

        const result = insertRecord.run(mappedRecord);

        inserted += result.changes;
      });

      return inserted;
    });

    const inserted = importRecords();

    monthTotal += inserted;

    console.log(
      `  ${source.name}: ${records.length} read, ${inserted} inserted`
    );
  }

  console.log(`  Total inserted: ${monthTotal}`);

  return monthTotal;
}

async function main() {
  console.log("\nMETRICS — Database builder");
  console.log("--------------------------------");

  const database = await initialiseDatabase();

  try {
    const insertRecord = database.prepare(INSERT_SQL);

    console.log("\nClearing previous records...");

    database.prepare("DELETE FROM stop_searches").run();

    console.log("Previous records cleared.");

    const monthDirectories = await fs.readdir(RAW_DIRECTORY, {
      withFileTypes: true,
    });

    const months = monthDirectories
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month))
      .sort();

    console.log(`Found ${months.length} monthly folders.`);

    let totalInserted = 0;

    for (const month of months) {
      const inserted = await importMonth(database, month, insertRecord);

      totalInserted += inserted;
    }

    const databaseCount = database
      .prepare("SELECT COUNT(*) AS total FROM stop_searches")
      .get();

    console.log("\n--------------------------------");
    console.log("DATABASE BUILD SUMMARY");
    console.log("--------------------------------");
    console.log(`Months processed: ${months.length}`);
    console.log(`Records inserted this run: ${totalInserted}`);
    console.log(`Records in database: ${databaseCount.total}`);
    console.log(`Database location: ${DATABASE_PATH}`);
  } finally {
    database.close();
  }
}

main().catch((error) => {
  console.error("\nDatabase build failed:");
  console.error(error.message);
  process.exitCode = 1;
});
