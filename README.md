# Sentry

**Stop & Search Intelligence**

Sentry is an interactive data exploration platform for analysing stop and search activity recorded by the Metropolitan Police Service.

The platform brings together reporting trends, demographic breakdowns, geographic distribution and individual records in a single interface. It is designed to make complex public data easier to explore, understand and interrogate.

## Features

### Overview

- Summary metrics across the selected reporting period.
- Monthly stop and search trends.
- Global reporting-period filtering.
- Exportable overview data.

### Demographics

- Age distribution.
- Gender distribution.
- Self-defined ethnicity.
- Officer-defined ethnicity.
- Handling of missing and unrecorded demographic information.
- CSV exports.

### Geography

- Interactive geographic heatmap.
- Borough-level breakdowns.
- Most frequently recorded location descriptions.
- Geographic coverage and coordinate information.
- CSV exports.

### Records

- Searchable individual stop and search records.
- Filtering by reporting period, month, age, gender, ethnicity and outcome.
- Sortable table columns for date, location, age, gender, ethnicity and outcome.
- Ascending and descending sort order.
- Sorting applied across the complete filtered dataset before pagination.
- Paginated results.
- Individual record detail panel.
- CSV exports of matching records.

### Global filtering

Reporting-period filters are shared across the application. Selected date ranges are maintained through URL query parameters, allowing filtered views to persist across navigation and page refreshes.

## Technology stack

| Area                  | Technology             |
| --------------------- | ---------------------- |
| Framework             | Next.js (App Router)   |
| UI                    | React                  |
| Language              | TypeScript             |
| Styling               | Tailwind CSS           |
| Charts                | Recharts               |
| Mapping               | Leaflet, React Leaflet |
| Heatmaps              | Leaflet.heat           |
| Database              | SQLite                 |
| Database access       | better-sqlite3         |
| Geographic processing | Turf.js                |
| Validation            | Zod                    |
| Icons                 | Lucide React           |

## Data source

Sentry uses public stop and search data from the [Police.uk API](https://data.police.uk/docs/).

The dataset snapshot used during development covers the Metropolitan Police force from September 2023 to July 2026.

The available snapshot contains 34 reporting months. March 2026 is not present in the source data.

### Dataset summary

| Measure                     | Records |
| --------------------------- | ------: |
| Total records               | 369,849 |
| Records with coordinates    | 357,828 |
| Records without coordinates |  12,021 |
| Reporting months            |      34 |

These figures describe the ingested dataset snapshot and may change when new source data becomes available.

## Data methodology

### Data ingestion

Data is retrieved from the Police.uk stop and search API using the Metropolitan Police force identifier.

The ingestion process discovers available reporting months and saves the monthly source records separately before transforming them into the SQLite database.

The `stops-force` endpoint is used as the source for database ingestion. Records are classified according to whether valid geographic coordinates are present.

Records without coordinates are retained rather than discarded.

### Reporting periods

Reporting-period filtering uses the original `source_month` field supplied by the ingestion process.

This is intentional. The event timestamp can fall on a different calendar date from the reporting month, so using the event timestamp to determine reporting periods could produce inconsistent monthly totals.

### Geographic attribution

Located records are compared against London borough boundary polygons using Turf.js point-in-polygon calculations.

The boundary data is stored in:

`data/boundaries/london-boroughs.geojson`

The geographic attribution process produces a separate `stop_search_boroughs` table.

Of the 357,828 records with coordinates in the development snapshot:

- 356,426 were successfully attributed to a borough.
- 1,402 could not be matched to a borough.

Unmatched records are retained with null borough attribution rather than being assigned to an estimated borough.

### Missing information

Missing demographic and outcome information is preserved and presented as **Not recorded** where appropriate.

Missing values are not inferred or substituted with assumed demographic information.

### Geographic precision

Coordinates supplied by the source may be anonymised or approximate. They should not be interpreted as precise incident locations.

The geographic views are intended to illustrate recorded spatial patterns rather than identify exact locations.

### Interpretation and limitations

The dataset has several limitations that should be considered when interpreting results:

- Not all records contain demographic information.
- Not all records contain geographic coordinates.
- Some located records cannot be attributed to a London borough.
- The available reporting months are incomplete.
- Borough totals are raw recorded counts, not population-adjusted rates.
- Differences in recorded counts do not independently establish disproportionality or explain the reasons behind observed patterns.

Sentry is intended as an exploratory analytical tool, not a causal or definitive assessment of police activity.

## Project structure

```text
police-metrics/
├── data/
│   ├── boundaries/
│   │   └── london-boroughs.geojson
│   ├── raw/
│   ├── metrics.db
│   └── validation-report.json
├── database/
│   └── schema.sql
├── public/
│   └── sentry-main-logo.png
├── scripts/
│   ├── assign-boroughs.mjs
│   ├── build-database.mjs
│   ├── check-overlap.mjs
│   ├── ingest-stops.mjs
│   ├── inspect-availability.mjs
│   ├── inspect-boroughs.mjs
│   ├── inspect-sample.mjs
│   ├── validate-raw-data.mjs
│   └── verify-database.mjs
└── src/
    ├── app/
    │   ├── api/
    │   ├── demographics/
    │   ├── geography/
    │   ├── records/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── dashboard/
    │   ├── demographics/
    │   ├── geography/
    │   ├── layout/
    │   └── records/
    ├── context/
    └── lib/
```

## Getting started

### Requirements

- Node.js
- npm

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

## Database setup

Sentry uses SQLite through `better-sqlite3`. The database is stored at `data/metrics.db`.

To recreate the dataset from the Police.uk API, follow these steps in order.

### 1. Download source data

```bash
npm run ingest
```

Retrieves available Metropolitan Police reporting months from the Police.uk API and saves the source records under `data/raw/`.

### 2. Validate source data

```bash
npm run validate
```

Checks the downloaded raw data.

### 3. Build the database

```bash
npm run db:build
```

Transforms the downloaded JSON records into the SQLite database using the schema defined in `database/schema.sql`.

### 4. Assign boroughs

```bash
node scripts/assign-boroughs.mjs
```

Uses the London borough boundary GeoJSON and Turf.js point-in-polygon calculations to attribute located records to boroughs. Results are stored in the `stop_search_boroughs` table.

Records that cannot be matched are retained with null borough attribution.

### 5. Verify the database

```bash
npm run db:verify
```

Runs the database verification script.

The application uses the resulting `data/metrics.db` file at runtime.

**Note:** The raw source data and generated database are separate. Rebuilding the database requires the raw monthly JSON files to be available locally.

## Development server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Available scripts

| Command                  | Description                                |
| ------------------------ | ------------------------------------------ |
| `npm run dev`            | Starts the development server              |
| `npm run build`          | Creates a production build                 |
| `npm run start`          | Starts the production server               |
| `npm run lint`           | Runs ESLint                                |
| `npm run ingest`         | Retrieves and ingests stop and search data |
| `npm run validate`       | Validates the raw source data              |
| `npm run db:build`       | Builds the SQLite database                 |
| `npm run db:verify`      | Verifies database integrity                |
| `npm run db:overlap`     | Runs the source overlap check              |
| `npm run ingest:inspect` | Inspects available source reporting months |
| `npm run ingest:sample`  | Inspects sample source records             |

## API routes

The application uses Next.js route handlers to retrieve and export data.

| Endpoint                   | Purpose                            |
| -------------------------- | ---------------------------------- |
| `/api/overview`            | Overview metrics                   |
| `/api/trends`              | Monthly trend data                 |
| `/api/demographics`        | Demographic breakdowns             |
| `/api/geography`           | Geographic and borough data        |
| `/api/records`             | Searchable stop and search records |
| `/api/overview/export`     | Overview CSV export                |
| `/api/demographics/export` | Demographics CSV export            |
| `/api/geography/export`    | Geography CSV export               |
| `/api/records/export`      | Records CSV export                 |

## Design principles

Sentry uses an editorial data-journalism approach combined with the structure and usability of a modern analytics application.

The interface prioritises:

- Clear information hierarchy.
- Consistent navigation and filtering.
- Accessible interactions.
- Responsive layouts.
- Transparent presentation of missing and incomplete data.
- Clear distinction between recorded data and analytical interpretation.

## Future considerations

Potential areas for further development include:

- Additional historical reporting periods as new data becomes available.
- Further validation of geographic attribution.
- More detailed comparisons across demographic and geographic dimensions.
- Additional accessibility and data-export improvements.
