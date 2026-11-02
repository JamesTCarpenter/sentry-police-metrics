import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getDateFilter, buildDateCondition } from "@/lib/dateFilters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const database = getDatabase();
    const { searchParams } = new URL(request.url);
    const dateFilter = getDateFilter(searchParams);
    const dateCondition = buildDateCondition(dateFilter);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || 25)
    );

    const offset = (page - 1) * pageSize;

    const search = searchParams.get("q")?.trim() || "";
    const month = searchParams.get("month") || "";
    const age = searchParams.get("age") || "";
    const gender = searchParams.get("gender") || "";
    const ethnicity = searchParams.get("ethnicity") || "";
    const outcome = searchParams.get("outcome") || "";

    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "ASC" : "DESC";

    const sortColumns: Record<string, string> = {
      date: "datetime",
      location: "street_name",
      age: "age_range",
      gender: "gender",
      ethnicity: "self_defined_ethnicity",
      outcome: "outcome",
    };

    const sortColumn = sortColumns[sortBy] || sortColumns.date;

    const conditions: string[] = [];
    const queryParams: string[] = [];

    if (dateCondition.condition) {
      conditions.push(dateCondition.condition);
      queryParams.push(...dateCondition.params);
    }

    if (search) {
      conditions.push(`
        (
          street_name LIKE ?
          OR outcome LIKE ?
          OR object_of_search LIKE ?
          OR legislation LIKE ?
          OR search_type LIKE ?
          OR age_range LIKE ?
          OR gender LIKE ?
          OR self_defined_ethnicity LIKE ?
          OR officer_defined_ethnicity LIKE ?
          OR operation_name LIKE ?
        )
      `);

      const searchTerm = `%${search}%`;
      queryParams.push(...Array(10).fill(searchTerm));
    }

    if (month) {
      conditions.push("source_month = ?");
      queryParams.push(month);
    }

    if (age) {
      conditions.push("age_range = ?");
      queryParams.push(age);
    }

    if (gender) {
      conditions.push("gender = ?");
      queryParams.push(gender);
    }

    if (ethnicity) {
      conditions.push("self_defined_ethnicity = ?");
      queryParams.push(ethnicity);
    }

    if (outcome) {
      conditions.push("outcome = ?");
      queryParams.push(outcome);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const countResult = database
      .prepare(
        `
      SELECT COUNT(*) AS total
      FROM stop_searches
      ${whereClause}
    `
      )
      .get(...queryParams) as { total: number };

    const records = database
      .prepare(
        `
      SELECT
        id,
        source_month,
        source_type,
        datetime,
        age_range,
        gender,
        self_defined_ethnicity,
        officer_defined_ethnicity,
        outcome,
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
        street_name
      FROM stop_searches
      ${whereClause}
      ORDER BY
        CASE
            WHEN ${sortColumn} IS NULL OR TRIM(${sortColumn}) = '' THEN 1
            ELSE 0
        END ASC,
        ${sortColumn} ${sortOrder},
        id ASC
        LIMIT ? OFFSET ?
    `
      )
      .all(...queryParams, pageSize, offset);

    const filterOptions = {
      months: database
        .prepare(
          `
            SELECT DISTINCT source_month AS value
            FROM stop_searches
            WHERE source_month >= COALESCE(?, '0000-00')
              AND source_month <= COALESCE(?, '9999-99')
            ORDER BY source_month DESC
          `
        )
        .all(dateFilter.startMonth || null, dateFilter.endMonth || null),

      ages: database
        .prepare(
          `
        SELECT DISTINCT age_range AS value
        FROM stop_searches
        WHERE age_range IS NOT NULL
        ORDER BY age_range
      `
        )
        .all(),

      genders: database
        .prepare(
          `
        SELECT DISTINCT gender AS value
        FROM stop_searches
        WHERE gender IS NOT NULL
        ORDER BY gender
      `
        )
        .all(),

      ethnicities: database
        .prepare(
          `
        SELECT DISTINCT self_defined_ethnicity AS value
        FROM stop_searches
        WHERE self_defined_ethnicity IS NOT NULL
        ORDER BY self_defined_ethnicity
      `
        )
        .all(),

      outcomes: database
        .prepare(
          `
        SELECT DISTINCT outcome AS value
        FROM stop_searches
        WHERE outcome IS NOT NULL
        ORDER BY outcome
      `
        )
        .all(),
    };

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          page_size: pageSize,
          total_records: countResult.total,
          total_pages: Math.ceil(countResult.total / pageSize),
        },
        filter_options: filterOptions,
      },
    });
  } catch (error) {
    console.error("Records API error:", error);

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
        error: "Unable to retrieve records.",
      },
      { status: 500 }
    );
  }
}
