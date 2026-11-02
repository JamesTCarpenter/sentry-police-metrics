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

    const getDistribution = (column: string) =>
      database
        .prepare(
          `
        SELECT
          COALESCE(${column}, 'Not recorded') AS category,
          COUNT(*) AS total
        FROM stop_searches
        ${whereClause}
        GROUP BY ${column}
        ORDER BY total DESC
      `
        )
        .all(...params) as {
        category: string;
        total: number;
      }[];

    const age = getDistribution("age_range");
    const gender = getDistribution("gender");
    const selfDefinedEthnicity = getDistribution("self_defined_ethnicity");
    const officerDefinedEthnicity = getDistribution(
      "officer_defined_ethnicity"
    );

    const rows = [
      ["REPORTING PERIOD"],
      ["Start month", dateFilter.startMonth || "Earliest available"],
      ["End month", dateFilter.endMonth || "Latest available"],
      [],
      ["AGE DISTRIBUTION"],
      ["Category", "Total"],
      ...age.map((item) => [item.category, item.total]),
      [],
      ["GENDER DISTRIBUTION"],
      ["Category", "Total"],
      ...gender.map((item) => [item.category, item.total]),
      [],
      ["SELF-DEFINED ETHNICITY"],
      ["Category", "Total"],
      ...selfDefinedEthnicity.map((item) => [item.category, item.total]),
      [],
      ["OFFICER-DEFINED ETHNICITY"],
      ["Category", "Total"],
      ...officerDefinedEthnicity.map((item) => [item.category, item.total]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="metrics-demographics.csv"',
      },
    });
  } catch (error) {
    console.error("Demographics export error:", error);

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
        error: "Unable to export demographic data.",
      },
      { status: 500 }
    );
  }
}
