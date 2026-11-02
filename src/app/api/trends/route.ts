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

    const trends = database
      .prepare(
        `
      SELECT
        source_month AS month,
        COUNT(*) AS total_searches,
        SUM(
          CASE WHEN source_type = 'located' THEN 1 ELSE 0 END
        ) AS located_searches,
        SUM(
          CASE WHEN source_type = 'unlocated' THEN 1 ELSE 0 END
        ) AS unlocated_searches
      FROM stop_searches
      ${whereClause}
      GROUP BY source_month
      ORDER BY source_month ASC
    `
      )
      .all(...params);

    return NextResponse.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error("Trends API error:", error);

    if (error instanceof Error && error.message.startsWith("Invalid")) {
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
        error: "Unable to retrieve trend data.",
      },
      { status: 500 }
    );
  }
}
