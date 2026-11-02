"use client";

import { useDateFilter } from "@/context/DateFilterContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import GeographyOverview from "@/components/geography/GeographyOverview";

export default function GeographyPage() {
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

    const exportUrl = `/api/geography/export${
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
          title="Geography"
          description="Explore the geographical distribution and concentration of Metropolitan Police stop-and-search records."
          onExport={handleExport}
        />

        <GeographyOverview />
      </div>
    </DashboardLayout>
  );
}
