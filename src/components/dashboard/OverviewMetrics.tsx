"use client";

import { useEffect, useState } from "react";
import MetricCard from "./MetricCard";
import { useDateFilter } from "@/context/DateFilterContext";
import MetricCardSkeleton from "./MetricCardSkeleton";

interface OverviewData {
  total_searches: number;
  located_searches: number;
  unlocated_searches: number;
  earliest_date: string;
  latest_date: string;
}

export default function OverviewMetrics() {
  const { dateFilter, isReady } = useDateFilter();

  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isReady) return;

    const controller = new AbortController();

    async function fetchOverview() {
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
          `/api/overview${queryString ? `?${queryString}` : ""}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch overview data");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error("Overview API returned an error");
        }

        setData(result.data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error(error);
        setError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchOverview();

    return () => controller.abort();
  }, [isReady, dateFilter.startMonth, dateFilter.endMonth, retryCount]);

  if (loading) {
    return (
      <>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </>
    );
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-5"
      >
        <p className="text-sm text-red-800">Unable to load overview metrics.</p>

        <button
          type="button"
          onClick={() => setRetryCount((current) => current + 1)}
          className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          Try again
        </button>
      </div>
    );
  }

  const locatedPercentage =
    data.total_searches > 0
      ? ((data.located_searches / data.total_searches) * 100).toFixed(1)
      : "0.0";

  const description = "Within the selected reporting period";

  return (
    <>
      <MetricCard
        title="Total Searches"
        value={data.total_searches.toLocaleString("en-GB")}
        description={description}
      />

      <MetricCard
        title="Located Searches"
        value={data.located_searches.toLocaleString("en-GB")}
        description={`${locatedPercentage}% of all recorded searches`}
      />

      <MetricCard
        title="Unlocated Searches"
        value={data.unlocated_searches.toLocaleString("en-GB")}
        description={description}
      />
    </>
  );
}
