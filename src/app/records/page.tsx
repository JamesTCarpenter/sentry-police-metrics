"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import RecordsTable from "@/components/records/RecordsTable";
import { useDateFilter } from "@/context/DateFilterContext";

interface ExportParams {
  search: string;
  filters: {
    month: string;
    age: string;
    gender: string;
    ethnicity: string;
    outcome: string;
  };
}

export default function RecordsPage() {
  const { dateFilter } = useDateFilter();

  const [exportParams, setExportParams] = useState<ExportParams>({
    search: "",
    filters: {
      month: "",
      age: "",
      gender: "",
      ethnicity: "",
      outcome: "",
    },
  });

  const handleExport = () => {
    const params = new URLSearchParams();

    if (dateFilter.startMonth) {
      params.set("startMonth", dateFilter.startMonth);
    }

    if (dateFilter.endMonth) {
      params.set("endMonth", dateFilter.endMonth);
    }

    if (exportParams.search) {
      params.set("q", exportParams.search);
    }

    Object.entries(exportParams.filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const exportUrl = `/api/records/export?${params.toString()}`;

    const link = document.createElement("a");
    link.href = exportUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Records"
          description="Explore individual Metropolitan Police stop-and-search records. Search and examine recorded details across the dataset."
          onExport={handleExport}
        />

        <RecordsTable onExportParamsChange={setExportParams} />
      </div>
    </DashboardLayout>
  );
}
