"use client";

import { useDateFilter } from "@/context/DateFilterContext";
import PageHeader from "@/components/dashboard/PageHeader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DemographicsOverview from "@/components/demographics/DemographicsOverview";

export default function DemographicsPage() {
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

    const exportUrl = `/api/demographics/export${
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
          title="Demographics"
          description="Explore the demographic characteristics of Metropolitan Police stop-and-search records."
          onExport={handleExport}
        />

        <DemographicsOverview />
      </div>
    </DashboardLayout>
  );
}
