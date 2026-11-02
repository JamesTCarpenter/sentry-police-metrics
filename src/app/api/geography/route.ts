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
      .get(...params);

    const mapCoverageConditions = [
      "latitude IS NOT NULL",
      "longitude IS NOT NULL",
      ...(condition ? [condition] : []),
    ];

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
      WHERE ${mapCoverageConditions.join(" AND ")}
    `
      )
      .get(...params);

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
      GROUP BY
        ROUND(latitude, 3),
        ROUND(longitude, 3)
      ORDER BY total_searches DESC
    `
      )
      .all(...params);

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
      .all(...params);

    const boroughDateFilter = buildDateCondition(dateFilter, "s.source_month");

    const boroughWhereClause = boroughDateFilter.condition
      ? `WHERE ${boroughDateFilter.condition} AND`
      : "WHERE";

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
      ${boroughWhereClause}
        b.borough_name IS NOT NULL
      GROUP BY b.borough_name, b.gss_code
      ORDER BY total_searches DESC
    `
      )
      .all(...boroughDateFilter.params);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        map_coverage: mapCoverage,
        density_grid: densityGrid,
        top_locations: topLocations,
        borough_breakdown: boroughBreakdown,
      },
    });
  } catch (error) {
    console.error("Geography API error:", error);

    if (
      error instanceof Error &&
      (error.message === "Invalid reporting month." ||
        error.message === "Start month cannot be after end month.")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve geographical data.",
      },
      { status: 500 }
    );
  }
}
