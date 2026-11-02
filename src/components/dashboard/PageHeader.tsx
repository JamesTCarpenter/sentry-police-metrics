"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { useDateFilter } from "@/context/DateFilterContext";

interface PageHeaderProps {
  title: string;
  description: string;
  onExport?: () => void;
  exporting?: boolean;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const AVAILABLE_MONTHS: string[] = [];

for (let year = 2023; year <= 2026; year++) {
  for (let month = 1; month <= 12; month++) {
    const value = `${year}-${String(month).padStart(2, "0")}`;

    if (value >= "2023-09" && value <= "2026-07") {
      AVAILABLE_MONTHS.push(value);
    }
  }
}

function formatMonth(value: string) {
  if (!value) return "All available dates";

  const [year, month] = value.split("-");

  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export default function PageHeader({
  title,
  description,
  onExport,
  exporting = false,
}: PageHeaderProps) {
  const { dateFilter, setDateFilter } = useDateFilter();

  const [isOpen, setIsOpen] = useState(false);

  const [draftFilter, setDraftFilter] = useState(dateFilter);

  function openPicker() {
    setDraftFilter(dateFilter);
    setIsOpen(!isOpen);
  }

  function applyFilter() {
    setDateFilter(draftFilter);
    setIsOpen(false);
  }

  function selectPreset(startMonth: string, endMonth: string) {
    setDraftFilter({ startMonth, endMonth });
  }

  function resetFilter() {
    setDraftFilter({
      startMonth: "",
      endMonth: "",
    });
  }

  const activeLabel =
    !dateFilter.startMonth && !dateFilter.endMonth
      ? "All available dates"
      : `${dateFilter.startMonth ? formatMonth(dateFilter.startMonth) : "Earliest"} – ${
          dateFilter.endMonth ? formatMonth(dateFilter.endMonth) : "Latest"
        }`;

  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {title}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
          {description}
        </p>
      </div>

      <div className="relative flex w-full flex-wrap items-center gap-3 lg:w-auto">
        <button
          type="button"
          onClick={openPicker}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-secondary sm:w-auto"
        >
          <CalendarDays size={16} aria-hidden="true" />

          {activeLabel}

          <ChevronDown
            size={15}
            aria-hidden="true"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={!onExport || exporting}
          className="cursor-pointer rounded-lg bg-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export data"}
        </button>

        {isOpen && (
          <div
            role="dialog"
            aria-label="Select reporting period"
            className="absolute right-0 top-full z-50 mt-3 w-[calc(100vw-40px)] max-w-[440px] rounded-xl border border-border bg-white p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Reporting period
                </h2>

                <p className="mt-1 text-xs text-text-secondary">
                  Select the months you want to explore.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close date picker"
                className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-secondary"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start-month"
                  className="mb-1.5 block text-xs font-medium text-text-secondary"
                >
                  From
                </label>

                <div className="relative">
                  <select
                    id="start-month"
                    value={draftFilter.startMonth}
                    onChange={(event) =>
                      setDraftFilter({
                        ...draftFilter,
                        startMonth: event.target.value,
                      })
                    }
                    className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-9 text-sm text-text-primary hover:bg-surface-secondary focus:outline-2 focus:outline-teal"
                  >
                    <option value="">Earliest</option>

                    {AVAILABLE_MONTHS.map((month) => (
                      <option
                        key={month}
                        value={month}
                        disabled={
                          !!draftFilter.endMonth && month > draftFilter.endMonth
                        }
                      >
                        {formatMonth(month)}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="end-month"
                  className="mb-1.5 block text-xs font-medium text-text-secondary"
                >
                  To
                </label>

                <div className="relative">
                  <select
                    id="end-month"
                    value={draftFilter.endMonth}
                    onChange={(event) =>
                      setDraftFilter({
                        ...draftFilter,
                        endMonth: event.target.value,
                      })
                    }
                    className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-9 text-sm text-text-primary hover:bg-surface-secondary focus:outline-2 focus:outline-teal"
                  >
                    <option value="">Latest</option>

                    {AVAILABLE_MONTHS.map((month) => (
                      <option
                        key={month}
                        value={month}
                        disabled={
                          !!draftFilter.startMonth &&
                          month < draftFilter.startMonth
                        }
                      >
                        {formatMonth(month)}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  />
                </div>
              </div>
            </div>

            <div className="my-4 border-t border-border" />

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Quick selections
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resetFilter}
                className="cursor-pointer rounded-lg bg-surface-secondary px-3 py-2 text-sm text-text-primary hover:bg-border"
              >
                All available dates
              </button>

              <button
                type="button"
                onClick={() => selectPreset("2026-01", "2026-07")}
                className="cursor-pointer rounded-lg bg-surface-secondary px-3 py-2 text-sm text-text-primary hover:bg-border"
              >
                2026
              </button>

              <button
                type="button"
                onClick={() => selectPreset("2025-01", "2025-12")}
                className="cursor-pointer rounded-lg bg-surface-secondary px-3 py-2 text-sm text-text-primary hover:bg-border"
              >
                2025
              </button>

              <button
                type="button"
                onClick={() => selectPreset("2024-01", "2024-12")}
                className="cursor-pointer rounded-lg bg-surface-secondary px-3 py-2 text-sm text-text-primary hover:bg-border"
              >
                2024
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={resetFilter}
                className="cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={applyFilter}
                className="cursor-pointer rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-navy"
              >
                Apply filters
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
