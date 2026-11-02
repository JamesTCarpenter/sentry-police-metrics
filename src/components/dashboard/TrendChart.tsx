"use client";

import { useEffect, useState } from "react";
import { useDateFilter } from "@/context/DateFilterContext";
import ChartSkeleton from "./ChartSkeleton";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendData {
  month: string;
  total_searches: number;
  located_searches: number;
  unlocated_searches: number;
}

interface ChartData {
  month: string;
  searches: number | null;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-GB").format(value);

const formatMonth = (month: string) => {
  const date = new Date(`${month}-01T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit",
  }).format(date);
};

function fillMissingMonths(data: TrendData[]): ChartData[] {
  if (data.length === 0) return [];

  const monthlyData = new Map(
    data.map((item) => [item.month, item.total_searches])
  );

  const firstMonth = data[0].month;
  const lastMonth = data[data.length - 1].month;

  const [startYear, startMonth] = firstMonth.split("-").map(Number);

  const [endYear, endMonth] = lastMonth.split("-").map(Number);

  const start = startYear * 12 + startMonth - 1;
  const end = endYear * 12 + endMonth - 1;

  const chartData: ChartData[] = [];

  for (let current = start; current <= end; current++) {
    const year = Math.floor(current / 12);
    const month = (current % 12) + 1;

    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    chartData.push({
      month: monthKey,
      searches: monthlyData.has(monthKey) ? monthlyData.get(monthKey)! : null,
    });
  }

  return chartData;
}

export default function TrendChart() {
  const { dateFilter, isReady } = useDateFilter();

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isReady) return;

    const controller = new AbortController();

    async function fetchTrends() {
      setLoading(true);
      setError(false);

      try {
        const params = new URLSearchParams();

        if (dateFilter.startMonth) {
          params.set("startMonth", dateFilter.startMonth);
        }

        if (dateFilter.endMonth) {
          params.set("endMonth", dateFilter.endMonth);
        }

        const queryString = params.toString();

        const response = await fetch(
          `/api/trends${queryString ? `?${queryString}` : ""}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch trend data");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error("Trend API returned an error");
        }

        setChartData(fillMissingMonths(result.data));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Trend chart error:", error);
        setError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchTrends();

    return () => controller.abort();
  }, [isReady, dateFilter.startMonth, dateFilter.endMonth, retryCount]);

  const hasMissingMonths = chartData.some((item) => item.searches === null);

  return (
    <section
      aria-labelledby="trend-chart-title"
      className="rounded-xl bg-white p-4 sm:p-5"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="trend-chart-title"
            className="text-base font-semibold text-text-primary sm:text-lg"
          >
            Stop and search activity over time
          </h2>

          <p className="mt-1 text-sm text-text-secondary">
            Monthly search volumes across available reporting periods
          </p>
        </div>

        <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
          Police.uk data
        </span>
      </div>

      <div className="h-[240px] w-full sm:h-[280px]">
        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <div
            role="alert"
            className="flex h-full flex-col items-center justify-center gap-3"
          >
            <p className="text-sm text-red-700">Unable to load trend data.</p>

            <button
              type="button"
              onClick={() => setRetryCount((current) => current + 1)}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
            >
              Try again
            </button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-text-secondary">
            No trend data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="searchGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#087F8C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#087F8C" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#E8EDF0"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fill: "#526477", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                minTickGap={24}
              />

              <YAxis
                tickFormatter={(value) => `${value / 1000}k`}
                tick={{ fill: "#526477", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={45}
              />

              <Tooltip
                labelFormatter={(label) => formatMonth(String(label))}
                formatter={(value) => [
                  value == null ? "No data" : formatNumber(Number(value)),
                  "Searches",
                ]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #DCE2E7",
                }}
              />

              <Area
                type="monotone"
                dataKey="searches"
                stroke="#087F8C"
                strokeWidth={2.5}
                fill="url(#searchGradient)"
                activeDot={{ r: 5, fill: "#087F8C" }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="mt-3 text-xs text-text-secondary">
        Source: Metropolitan Police stop-and-search records via Police.uk.
        {hasMissingMonths && " Some reporting months have no available data."}
      </p>

      <div className="sr-only">
        Monthly search volumes:
        {chartData.map((item) => (
          <span key={item.month}>
            {formatMonth(item.month)}:{" "}
            {item.searches === null
              ? "No data available."
              : `${formatNumber(item.searches)} searches.`}
          </span>
        ))}
      </div>
    </section>
  );
}
