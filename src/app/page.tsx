"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import TrendChart from "@/components/dashboard/TrendChart";
import InsightPanel from "@/components/dashboard/InsightPanel";
import OverviewMetrics from "@/components/dashboard/OverviewMetrics";
import { useDateFilter } from "@/context/DateFilterContext";

export default function Home() {
  const { dateFilter } = useDateFilter();

  function handleExport() {
    const params = new URLSearchParams();

    if (dateFilter.startMonth) {
      params.set("startMonth", dateFilter.startMonth);
    }

    if (dateFilter.endMonth) {
      params.set("endMonth", dateFilter.endMonth);
    }

    const queryString = params.toString();

    const exportUrl = `/api/overview/export${
      queryString ? `?${queryString}` : ""
    }`;

    const link = document.createElement("a");
    link.href = exportUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title="Stop & Search Overview"
          description="Explore historical stop and search activity, outcomes and trends across the Metropolitan Police Service."
          onExport={handleExport}
        />

        <section aria-label="Stop and search headline statistics">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <OverviewMetrics />
          </div>
        </section>

        <section
          aria-label="Historical stop and search activity"
          className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]"
        >
          <TrendChart />
          <InsightPanel />
        </section>
      </div>
    </DashboardLayout>
  );
}
