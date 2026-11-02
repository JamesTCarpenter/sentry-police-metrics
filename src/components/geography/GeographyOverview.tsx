"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useDateFilter } from "@/context/DateFilterContext";
import type { DensityPoint } from "./GeographyMap";
import TopLocations from "./TopLocations";
import BoroughBreakdown from "./BoroughBreakdown";
import MetricCardSkeleton from "@/components/dashboard/MetricCardSkeleton";
import ChartSkeleton from "@/components/dashboard/ChartSkeleton";

const GeographyMap = dynamic(() => import("./GeographyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-xl bg-surface-secondary sm:h-[520px]">
      <p className="text-sm text-text-secondary">Loading map...</p>
    </div>
  ),
});

interface GeographyData {
  summary: {
    total_searches: number;
    located_searches: number;
    unlocated_searches: number;
  };
  map_coverage: {
    total_records: number;
    map_eligible: number;
    outside_map_bounds: number;
  };
  density_grid: DensityPoint[];
  top_locations: {
    location: string;
    total_searches: number;
  }[];
  borough_breakdown: {
    borough_name: string;
    gss_code: string;
    total_searches: number;
  }[];
}

export default function GeographyOverview() {
  const { dateFilter, isReady } = useDateFilter();

  const [data, setData] = useState<GeographyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isReady) return;

    const controller = new AbortController();

    async function fetchGeography() {
      setLoading(true);
      setError(null);

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
          `/api/geography${queryString ? `?${queryString}` : ""}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to retrieve geographical data.");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error("Unable to retrieve geographical data.");
        }

        setData(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Geography API error:", err);
        setError("Unable to load geographical data. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchGeography();

    return () => controller.abort();
  }, [isReady, dateFilter.startMonth, dateFilter.endMonth, retryCount]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-5 sm:space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-t border-border p-4 sm:p-5">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-72 max-w-full rounded bg-slate-100" />
          </div>

          <div className="h-[400px] bg-slate-100 sm:h-[520px]" />

          <div className="border-b border-border p-4 sm:p-5">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />
          </div>
        </div>

        <ChartSkeleton height={380} />
        <ChartSkeleton height={900} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-red-800">
          {error ?? "Geographical data is unavailable."}
        </p>

        <button
          type="button"
          onClick={() => setRetryCount((current) => current + 1)}
          className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-surface p-4 sm:p-5">
          <p className="text-sm text-text-secondary">
            Records with coordinates
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
            {data.summary.located_searches.toLocaleString("en-GB")}
          </p>
        </div>

        <div className="rounded-xl bg-surface p-5">
          <p className="text-sm text-text-secondary">
            Records without coordinates
          </p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {data.summary.unlocated_searches.toLocaleString("en-GB")}
          </p>
        </div>

        <div className="rounded-xl bg-surface p-5">
          <p className="text-sm text-text-secondary">Records included on map</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {data.map_coverage.map_eligible.toLocaleString("en-GB")}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl bg-surface">
        <div className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-text-primary sm:text-lg">
            Stop and search density
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Approximate concentration of recorded searches across the
            Metropolitan Police area.
          </p>
        </div>

        {data.density_grid.length > 0 ? (
          <GeographyMap points={data.density_grid} />
        ) : (
          <div
            role="status"
            className="flex h-[400px] flex-col items-center justify-center bg-surface-secondary px-6 text-center sm:h-[520px]"
          >
            <p className="text-base font-semibold text-text-primary">
              No geographical data available
            </p>

            <p className="mt-2 max-w-md text-sm text-text-secondary">
              There are no records with usable coordinates within the geographic
              bounds for this reporting period. Try selecting a different
              reporting period.
            </p>
          </div>
        )}

        <div className="px-5 py-4">
          <p className="text-xs leading-5 text-text-secondary">
            The map includes records with coordinates inside the provisional
            geographic bounds used for this view.{" "}
            {data.map_coverage.outside_map_bounds.toLocaleString("en-GB")}{" "}
            located records fall outside those bounds, and records without
            coordinates cannot be plotted. Grid cells represent approximate
            geographic groupings, not individual search locations.
          </p>
        </div>
      </section>

      {data.top_locations.length > 0 ? (
        <TopLocations data={data.top_locations} />
      ) : (
        <section
          role="status"
          className="rounded-xl border border-border bg-white px-6 py-12 text-center"
        >
          <h2 className="text-base font-semibold text-text-primary">
            No location data available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            No recorded location descriptions are available within the selected
            reporting period and geographic bounds.
          </p>
        </section>
      )}

      {data.borough_breakdown.length > 0 ? (
        <BoroughBreakdown data={data.borough_breakdown} />
      ) : (
        <section
          role="status"
          className="rounded-xl border border-border bg-white px-6 py-12 text-center"
        >
          <h2 className="text-base font-semibold text-text-primary">
            No borough data available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            No records could be attributed to a London borough within the
            selected reporting period.
          </p>
        </section>
      )}
    </div>
  );
}
