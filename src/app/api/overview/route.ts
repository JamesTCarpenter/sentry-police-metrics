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

    const totals = database
      .prepare(
        `
      SELECT
        COUNT(*) AS total_searches,

        SUM(
          CASE WHEN source_type = 'located'
          THEN 1 ELSE 0 END
        ) AS located_searches,

        SUM(
          CASE WHEN source_type = 'unlocated'
          THEN 1 ELSE 0 END
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

    const dateRange = database
      .prepare(
        `
      SELECT
        MIN(datetime) AS earliest_date,
        MAX(datetime) AS latest_date
      FROM stop_searches
      ${whereClause}
    `
      )
      .get(...params) as {
      earliest_date: string | null;
      latest_date: string | null;
    };

    return NextResponse.json({
      success: true,
      data: {
        ...totals,
        ...dateRange,
      },
    });
  } catch (error) {
    console.error("Overview API error:", error);

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
        error: "Unable to retrieve overview data.",
      },
      { status: 500 }
    );
  }
}
