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
      .all(...params) as {
      month: string;
      total_searches: number;
      located_searches: number;
      unlocated_searches: number;
    }[];

    const rows = [
      ["OVERVIEW METRICS"],
      ["Metric", "Value"],
      ["Total searches", totals.total_searches],
      ["Located searches", totals.located_searches],
      ["Unlocated searches", totals.unlocated_searches],
      ["Earliest recorded date", dateRange.earliest_date ?? "Not available"],
      ["Latest recorded date", dateRange.latest_date ?? "Not available"],
      ["Reporting period start", dateFilter.startMonth || "Earliest available"],
      ["Reporting period end", dateFilter.endMonth || "Latest available"],
      [],
      ["MONTHLY TREND DATA"],
      [
        "Reporting month",
        "Total searches",
        "Located searches",
        "Unlocated searches",
      ],
      ...trends.map((trend) => [
        trend.month,
        trend.total_searches,
        trend.located_searches,
        trend.unlocated_searches,
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
        "Content-Disposition": 'attachment; filename="metrics-overview.csv"',
      },
    });
  } catch (error) {
    console.error("Overview export error:", error);

    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Unable to export overview data." },
      { status: 500 }
    );
  }
}
