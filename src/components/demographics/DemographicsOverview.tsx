"use client";

import { useEffect, useState } from "react";
import { useDateFilter } from "@/context/DateFilterContext";

import AgeDistribution from "./AgeDistribution";
import GenderDistribution from "./GenderDistribution";
import SelfDefinedEthnicity from "./SelfDefinedEthnicity";
import OfficerDefinedEthnicity from "./OfficerDefinedEthnicity";
import ChartSkeleton from "@/components/dashboard/ChartSkeleton";
import MetricCardSkeleton from "../dashboard/MetricCardSkeleton";

interface DemographicCategory {
  category: string;
  total: number;
}

interface DemographicsData {
  age: DemographicCategory[];
  gender: DemographicCategory[];
  self_defined_ethnicity: DemographicCategory[];
  officer_defined_ethnicity: DemographicCategory[];
}

export default function DemographicsOverview() {
  const { dateFilter, isReady } = useDateFilter();

  const [data, setData] = useState<DemographicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isReady) return;

    const controller = new AbortController();

    async function fetchDemographics() {
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
          `/api/demographics${queryString ? `?${queryString}` : ""}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch demographic data");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error("Demographics API returned an error");
        }

        setData(result.data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Demographics error:", error);
        setError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchDemographics();

    return () => controller.abort();
  }, [isReady, dateFilter.startMonth, dateFilter.endMonth, retryCount]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse sm:space-y-8">
        <section>
          <div className="mb-4 h-6 w-56 rounded bg-slate-200" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </section>

        <ChartSkeleton height={260} />

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartSkeleton height={340} />
          <ChartSkeleton height={340} />
        </section>

        <ChartSkeleton height={420} />
        <ChartSkeleton height={420} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-red-800">Unable to load demographic data.</p>

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

  const totalRecords = data.age.reduce((sum, item) => sum + item.total, 0);

  const missingAge =
    data.age.find((item) => item.category === "Not recorded")?.total ?? 0;

  const missingGender =
    data.gender.find((item) => item.category === "Not recorded")?.total ?? 0;

  const missingSelfEthnicity =
    data.self_defined_ethnicity.find((item) => item.category === "Not recorded")
      ?.total ?? 0;

  const missingOfficerEthnicity =
    data.officer_defined_ethnicity.find(
      (item) => item.category === "Not recorded"
    )?.total ?? 0;

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-GB").format(value);

  const getPercentage = (value: number) =>
    totalRecords > 0 ? ((value / totalRecords) * 100).toFixed(1) : "0.0";

  const reportingPeriodDescription =
    dateFilter.startMonth || dateFilter.endMonth
      ? "Within the selected reporting period."
      : "Across all available reporting periods.";

  return (
    <div className="space-y-6 sm:space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-text-primary">
          Demographic data coverage
        </h2>

        <p className="mt-1 text-sm text-text-secondary">
          Overview of the demographic information recorded.{" "}
          {reportingPeriodDescription}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-xl bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-text-secondary">
              Total records
            </p>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-text-primary sm:text-3xl">
              {formatNumber(totalRecords)}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              {reportingPeriodDescription}
            </p>
          </article>

          <article className="rounded-xl bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-text-secondary">
              Age not recorded
            </p>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-text-primary sm:text-3xl">
              {formatNumber(missingAge)}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              {getPercentage(missingAge)}% of all records
            </p>
          </article>

          <article className="rounded-xl bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-text-secondary">
              Gender not recorded
            </p>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-text-primary sm:text-3xl">
              {formatNumber(missingGender)}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              {getPercentage(missingGender)}% of all records
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-text-primary">
          Data availability
        </h2>

        <p className="mt-1 text-sm text-text-secondary">
          Records where demographic information was not recorded.
        </p>

        <div className="mt-5 space-y-4">
          {[
            { label: "Age", value: missingAge },
            { label: "Gender", value: missingGender },
            {
              label: "Self-defined ethnicity",
              value: missingSelfEthnicity,
            },
            {
              label: "Officer-defined ethnicity",
              value: missingOfficerEthnicity,
            },
          ].map((item) => {
            const percentage =
              totalRecords > 0 ? (item.value / totalRecords) * 100 : 0;

            return (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-text-secondary">{item.label}</span>

                  <span className="font-medium text-text-primary">
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-surface-secondary"
                  role="img"
                  aria-label={`${item.label}: ${percentage.toFixed(1)} percent not recorded`}
                >
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AgeDistribution data={data.age} />
        <GenderDistribution data={data.gender} />
      </section>

      <section>
        <SelfDefinedEthnicity data={data.self_defined_ethnicity} />
      </section>

      <section>
        <OfficerDefinedEthnicity data={data.officer_defined_ethnicity} />
      </section>
    </div>
  );
}
