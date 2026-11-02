export interface DateFilter {
  startMonth: string;
  endMonth: string;
}

export function getDateFilter(searchParams: URLSearchParams): DateFilter {
  const startMonth = searchParams.get("startMonth") || "";
  const endMonth = searchParams.get("endMonth") || "";

  const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

  if (
    (startMonth && !monthPattern.test(startMonth)) ||
    (endMonth && !monthPattern.test(endMonth))
  ) {
    throw new Error("Invalid reporting month.");
  }

  if (startMonth && endMonth && startMonth > endMonth) {
    throw new Error("Start month cannot be after end month.");
  }

  return {
    startMonth,
    endMonth,
  };
}

export function buildDateCondition(
  filter: DateFilter,
  column = "source_month"
): {
  condition: string;
  params: string[];
} {
  const conditions: string[] = [];
  const params: string[] = [];

  if (filter.startMonth) {
    conditions.push(`${column} >= ?`);
    params.push(filter.startMonth);
  }

  if (filter.endMonth) {
    conditions.push(`${column} <= ?`);
    params.push(filter.endMonth);
  }

  return {
    condition: conditions.length ? conditions.join(" AND ") : "",
    params,
  };
}
