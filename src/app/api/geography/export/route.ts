import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getDateFilter, buildDateCondition } from "@/lib/dateFilters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const database = getDatabase();
    const { searchParams } = new URL(request.url);

    const dateFilter = getDateFilter(searchParams);
    const { condition, params } = buildDateCondition(dateFilter);

    const whereClause = condition ? `WHERE ${condition}` : "";

    const summary = database
      .prepare(
        `
      SELECT
        COUNT(*) AS total_searches,
        SUM(
          CASE
            WHEN latitude IS NOT NULL AND longitude IS NOT NULL
            THEN 1 ELSE 0
          END
        ) AS located_searches,
        SUM(
          CASE
            WHEN latitude IS NULL OR longitude IS NULL
            THEN 1 ELSE 0
          END
        ) AS unlocated_searches
      FROM stop_searches
      ${whereClause}
    `
      )
      .get(...params) as {
      total_searches: number;
      located_searches: number;
      unlocated_searches: number;
    };

    const mapCoverage = database
      .prepare(
        `
      SELECT
        COUNT(*) AS total_records,
        SUM(
          CASE
            WHEN latitude BETWEEN 51.2 AND 51.8
              AND longitude BETWEEN -0.6 AND 0.4
            THEN 1 ELSE 0
          END
        ) AS map_eligible,
        SUM(
          CASE
            WHEN latitude < 51.2
              OR latitude > 51.8
              OR longitude < -0.6
              OR longitude > 0.4
            THEN 1 ELSE 0
          END
        ) AS outside_map_bounds
      FROM stop_searches
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        ${condition ? `AND ${condition}` : ""}
    `
      )
      .get(...params) as {
      total_records: number;
      map_eligible: number;
      outside_map_bounds: number;
    };

    const densityGrid = database
      .prepare(
        `
      SELECT
        ROUND(latitude, 3) AS latitude,
        ROUND(longitude, 3) AS longitude,
        COUNT(*) AS total_searches
      FROM stop_searches
      ${whereClause ? `${whereClause} AND` : "WHERE"}
        latitude BETWEEN 51.2 AND 51.8
        AND longitude BETWEEN -0.6 AND 0.4
      GROUP BY ROUND(latitude, 3), ROUND(longitude, 3)
      ORDER BY total_searches DESC
    `
      )
      .all(...params) as {
      latitude: number;
      longitude: number;
      total_searches: number;
    }[];

    const topLocations = database
      .prepare(
        `
      SELECT
        street_name AS location,
        COUNT(*) AS total_searches
      FROM stop_searches
      ${whereClause ? `${whereClause} AND` : "WHERE"}
        latitude BETWEEN 51.2 AND 51.8
        AND longitude BETWEEN -0.6 AND 0.4
        AND street_name IS NOT NULL
      GROUP BY street_name
      ORDER BY total_searches DESC
      LIMIT 10
    `
      )
      .all(...params) as {
      location: string;
      total_searches: number;
    }[];

    const boroughDateFilter = buildDateCondition(dateFilter, "s.source_month");

    const boroughBreakdown = database
      .prepare(
        `
      SELECT
        b.borough_name,
        b.gss_code,
        COUNT(*) AS total_searches
      FROM stop_search_boroughs b
      INNER JOIN stop_searches s
        ON b.stop_search_id = s.id
      ${
        boroughDateFilter.condition
          ? `WHERE ${boroughDateFilter.condition} AND`
          : "WHERE"
      }
        b.borough_name IS NOT NULL
      GROUP BY b.borough_name, b.gss_code
      ORDER BY total_searches DESC
    `
      )
      .all(...boroughDateFilter.params) as {
      borough_name: string;
      gss_code: string;
      total_searches: number;
    }[];

    const rows = [
      ["REPORTING PERIOD"],
      ["Start month", dateFilter.startMonth || "Earliest available"],
      ["End month", dateFilter.endMonth || "Latest available"],
      [],
      ["GEOGRAPHICAL SUMMARY"],
      ["Metric", "Value"],
      ["Total searches", summary.total_searches],
      ["Located records", summary.located_searches],
      ["Unlocated records", summary.unlocated_searches],
      [],
      ["MAP COVERAGE"],
      ["Metric", "Value"],
      ["Records with coordinates", mapCoverage.total_records],
      ["Records included on map", mapCoverage.map_eligible],
      ["Located records outside map bounds", mapCoverage.outside_map_bounds],
      [],
      ["TOP RECORDED LOCATIONS"],
      ["Location description", "Total searches"],
      ...topLocations.map((item) => [item.location, item.total_searches]),
      [],
      ["BOROUGH BREAKDOWN"],
      ["Borough", "GSS code", "Total searches"],
      ...boroughBreakdown.map((item) => [
        item.borough_name,
        item.gss_code,
        item.total_searches,
      ]),
      [],
      ["DENSITY GRID"],
      ["Latitude", "Longitude", "Total searches"],
      ...densityGrid.map((item) => [
        item.latitude,
        item.longitude,
        item.total_searches,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="metrics-geography.csv"',
      },
    });
  } catch (error) {
    console.error("Geography export error:", error);

    if (
      error instanceof Error &&
      (error.message === "Invalid reporting month." ||
        error.message === "Start month cannot be after end month.")
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to export geographical data.",
      },
      { status: 500 }
    );
  }
}
