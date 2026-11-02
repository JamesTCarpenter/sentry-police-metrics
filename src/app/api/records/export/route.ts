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

    const search = searchParams.get("q")?.trim() || "";
    const month = searchParams.get("month") || "";
    const age = searchParams.get("age") || "";
    const gender = searchParams.get("gender") || "";
    const ethnicity = searchParams.get("ethnicity") || "";
    const outcome = searchParams.get("outcome") || "";

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
      ORDER BY datetime DESC, id ASC
    `
      )
      .all(...queryParams) as Record<string, string | number | null>[];

    const headers = [
      "Record ID",
      "Reporting Month",
      "Data Classification",
      "Date",
      "Age Range",
      "Gender",
      "Self-defined Ethnicity",
      "Officer-defined Ethnicity",
      "Outcome",
      "Object of Search",
      "Legislation",
      "Search Type",
      "Involved Person",
      "Part of Operation",
      "Operation Name",
      "Outcome Linked to Object of Search",
      "More Than Outer Clothing Removed",
      "Latitude",
      "Longitude",
      "Location Description",
    ];

    const rows = [
      ["REPORTING PERIOD"],
      ["Start month", dateFilter.startMonth || "Earliest available"],
      ["End month", dateFilter.endMonth || "Latest available"],
      ["SEARCH AND FILTERS"],
      ["Search", search || "None"],
      ["Reporting month filter", month || "All"],
      ["Age filter", age || "All"],
      ["Gender filter", gender || "All"],
      ["Ethnicity filter", ethnicity || "All"],
      ["Outcome filter", outcome || "All"],
      [],
      headers,
      ...records.map((record) => [
        record.id,
        record.source_month,
        record.source_type,
        record.datetime,
        record.age_range,
        record.gender,
        record.self_defined_ethnicity,
        record.officer_defined_ethnicity,
        record.outcome,
        record.object_of_search,
        record.legislation,
        record.search_type,
        record.involved_person,
        record.operation,
        record.operation_name,
        record.outcome_linked_to_object_of_search,
        record.removal_of_more_than_outer_clothing,
        record.latitude,
        record.longitude,
        record.street_name,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="metrics-records.csv"',
      },
    });
  } catch (error) {
    console.error("Records export error:", error);

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
        error: "Unable to export records.",
      },
      { status: 500 }
    );
  }
}
