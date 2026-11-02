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

    const age = database
      .prepare(
        `
      SELECT
        COALESCE(age_range, 'Not recorded') AS category,
        COUNT(*) AS total
      FROM stop_searches
      ${whereClause}
      GROUP BY age_range
      ORDER BY total DESC
    `
      )
      .all(...params);

    const gender = database
      .prepare(
        `
      SELECT
        COALESCE(gender, 'Not recorded') AS category,
        COUNT(*) AS total
      FROM stop_searches
      ${whereClause}
      GROUP BY gender
      ORDER BY total DESC
    `
      )
      .all(...params);

    const selfDefinedEthnicity = database
      .prepare(
        `
      SELECT
        COALESCE(self_defined_ethnicity, 'Not recorded') AS category,
        COUNT(*) AS total
      FROM stop_searches
      ${whereClause}
      GROUP BY self_defined_ethnicity
      ORDER BY total DESC
    `
      )
      .all(...params);

    const officerDefinedEthnicity = database
      .prepare(
        `
      SELECT
        COALESCE(officer_defined_ethnicity, 'Not recorded') AS category,
        COUNT(*) AS total
      FROM stop_searches
      ${whereClause}
      GROUP BY officer_defined_ethnicity
      ORDER BY total DESC
    `
      )
      .all(...params);

    return NextResponse.json({
      success: true,
      data: {
        age,
        gender,
        self_defined_ethnicity: selfDefinedEthnicity,
        officer_defined_ethnicity: officerDefinedEthnicity,
      },
    });
  } catch (error) {
    console.error("Demographics API error:", error);

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
        error: "Unable to retrieve demographic data.",
      },
      { status: 500 }
    );
  }
}
