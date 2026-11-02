"use client";

import { useEffect, useRef, useState } from "react";
import { useDateFilter } from "@/context/DateFilterContext";
import DetailItem from "./DetailItem";

interface StopSearchRecord {
  id: string;
  source_month: string;
  source_type: string;
  datetime: string | null;
  age_range: string | null;
  gender: string | null;
  self_defined_ethnicity: string | null;
  officer_defined_ethnicity: string | null;
  outcome: string | null;
  object_of_search: string | null;
  legislation: string | null;
  search_type: string | null;
  involved_person: number | null;
  operation: number | null;
  operation_name: string | null;
  outcome_linked_to_object_of_search: number | null;
  removal_of_more_than_outer_clothing: number | null;
  latitude: number | null;
  longitude: number | null;
  street_name: string | null;
}

interface FilterOption {
  value: string;
}

interface RecordsResponse {
  success: boolean;
  data: {
    records: StopSearchRecord[];
    pagination: {
      page: number;
      page_size: number;
      total_records: number;
      total_pages: number;
    };
    filter_options: {
      months: FilterOption[];
      ages: FilterOption[];
      genders: FilterOption[];
      ethnicities: FilterOption[];
      outcomes: FilterOption[];
    };
  };
}

interface RecordsTableProps {
  onExportParamsChange: (params: {
    search: string;
    filters: {
      month: string;
      age: string;
      gender: string;
      ethnicity: string;
      outcome: string;
    };
  }) => void;
}

export default function RecordsTable({
  onExportParamsChange,
}: RecordsTableProps) {
  const { dateFilter, isReady } = useDateFilter();
  const [records, setRecords] = useState<StopSearchRecord[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState({
    page: 1,
    startMonth: "",
    endMonth: "",
  });

  const page =
    pagination.startMonth === dateFilter.startMonth &&
    pagination.endMonth === dateFilter.endMonth
      ? pagination.page
      : 1;

  const setPage = (nextPage: number | ((current: number) => number)) => {
    const resolvedPage =
      typeof nextPage === "function" ? nextPage(page) : nextPage;

    setPagination({
      page: resolvedPage,
      startMonth: dateFilter.startMonth,
      endMonth: dateFilter.endMonth,
    });
  };
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [filters, setFilters] = useState({
    month: "",
    age: "",
    gender: "",
    ethnicity: "",
    outcome: "",
  });

  const [filterOptions, setFilterOptions] = useState<
    RecordsResponse["data"]["filter_options"] | null
  >(null);

  const [selectedRecord, setSelectedRecord] = useState<StopSearchRecord | null>(
    null
  );

  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    onExportParamsChange({ search, filters });
  }, [search, filters, onExportParamsChange, sortBy]);

  useEffect(() => {
    if (!isReady) return;

    const controller = new AbortController();

    async function fetchRecords() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          pageSize: "25",
        });

        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);

        if (search) {
          params.set("q", search);
        }

        if (dateFilter.startMonth) {
          params.set("startMonth", dateFilter.startMonth);
        }

        if (dateFilter.endMonth) {
          params.set("endMonth", dateFilter.endMonth);
        }

        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.set(key, value);
          }
        });

        const response = await fetch(`/api/records?${params}`, {
          signal: controller.signal,
        });

        const result: RecordsResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error("Unable to retrieve records.");
        }

        setRecords(result.data.records);
        setTotalPages(result.data.pagination.total_pages);
        setTotalRecords(result.data.pagination.total_records);
        setFilterOptions(result.data.filter_options);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Records fetch error:", error);
        setError("Unable to load records. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchRecords();

    return () => controller.abort();
  }, [
    isReady,
    page,
    search,
    filters,
    sortBy,
    sortOrder,
    dateFilter.startMonth,
    dateFilter.endMonth,
    retryCount,
  ]);

  useEffect(() => {
    if (!selectedRecord) {
      selectedRowRef.current?.focus();
      return;
    }

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedRecord(null);
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRecord]);

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder(column === "date" ? "desc" : "asc");
    }

    setPage(1);
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleResetFilters() {
    setFilters({
      month: "",
      age: "",
      gender: "",
      ethnicity: "",
      outcome: "",
    });

    setSearch("");
    setSearchInput("");
    setPage(1);
  }

  function formatDate(value: string | null) {
    if (!value) return "Not recorded";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return (
    <section className="rounded-xl bg-surface">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Stop & Search Records
          </h2>
          <p className="mt-1 text-sm text-text-secondary" aria-live="polite">
            {loading
              ? "Loading records..."
              : `${totalRecords.toLocaleString("en-GB")} records found`}
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex w-full gap-2 lg:w-auto">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search records..."
            className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-teal sm:w-64 sm:flex-none"
          />

          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-navy"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 xl:grid-cols-3">
        <div className="relative">
          <select
            aria-label="Filter by reporting month"
            value={filters.month}
            onChange={(event) => {
              setFilters({ ...filters, month: event.target.value });
              setPage(1);
            }}
            className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-10 text-sm text-text-primary hover:bg-surface-secondary focus:border-teal focus:outline-none"
          >
            <option value="">All reporting months</option>
            {filterOptions?.months.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="relative">
          <select
            aria-label="Filter by age range"
            value={filters.age}
            onChange={(event) => {
              setFilters({ ...filters, age: event.target.value });
              setPage(1);
            }}
            className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-10 text-sm text-text-primary hover:bg-surface-secondary focus:border-teal focus:outline-none"
          >
            <option value="">All age ranges</option>
            {filterOptions?.ages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="relative">
          <select
            aria-label="Filter by gender"
            value={filters.gender}
            onChange={(event) => {
              setFilters({ ...filters, gender: event.target.value });
              setPage(1);
            }}
            className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-10 text-sm text-text-primary hover:bg-surface-secondary focus:border-teal focus:outline-none"
          >
            <option value="">All genders</option>
            {filterOptions?.genders.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="relative">
          <select
            aria-label="Filter by ethnicity"
            value={filters.ethnicity}
            onChange={(event) => {
              setFilters({ ...filters, ethnicity: event.target.value });
              setPage(1);
            }}
            className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-10 text-sm text-text-primary hover:bg-surface-secondary focus:border-teal focus:outline-none"
          >
            <option value="">All ethnicities</option>
            {filterOptions?.ethnicities.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="relative">
          <select
            aria-label="Filter by outcome"
            value={filters.outcome}
            onChange={(event) => {
              setFilters({ ...filters, outcome: event.target.value });
              setPage(1);
            }}
            className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-10 text-sm text-text-primary hover:bg-surface-secondary focus:border-teal focus:outline-none"
          >
            <option value="">All outcomes</option>
            {filterOptions?.outcomes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          disabled={
            !search && !searchInput && !Object.values(filters).some(Boolean)
          }
          className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset filters
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 border-b border-border bg-red-50 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-800">{error}</p>

          <button
            type="button"
            onClick={() => setRetryCount((current) => current + 1)}
            className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            Try again
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
          <thead className="bg-surface-secondary text-xs uppercase tracking-wide text-text-secondary">
            <tr>
              {[
                { label: "Date", key: "date" },
                { label: "Location", key: "location" },
                { label: "Age", key: "age" },
                { label: "Gender", key: "gender" },
                { label: "Ethnicity", key: "ethnicity" },
                { label: "Object of search", key: null },
                { label: "Outcome", key: "outcome" },
                { label: "Data", key: null },
              ].map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  aria-sort={
                    column.key && sortBy === column.key
                      ? sortOrder === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className="px-6 py-4 font-medium"
                >
                  {column.key ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.key!)}
                      className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
                      aria-label={`Sort by ${column.label}${
                        sortBy === column.key
                          ? sortOrder === "asc"
                            ? ", currently ascending"
                            : ", currently descending"
                          : ""
                      }`}
                    >
                      {column.label}

                      <span
                        aria-hidden="true"
                        className={`text-sm ${
                          sortBy === column.key
                            ? "font-bold text-teal"
                            : "text-text-secondary/50"
                        }`}
                      >
                        {sortBy === column.key
                          ? sortOrder === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} aria-hidden="true" className="animate-pulse">
                  <td className="px-6 py-5">
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </td>

                  <td className="px-6 py-5">
                    <div className="h-4 w-36 rounded bg-slate-200" />
                  </td>

                  <td className="px-6 py-5">
                    <div className="h-4 w-12 rounded bg-slate-100" />
                  </td>

                  <td className="px-6 py-5">
                    <div className="h-4 w-14 rounded bg-slate-100" />
                  </td>

                  <td className="px-6 py-5">
                    <div className="h-4 w-28 rounded bg-slate-100" />
                  </td>

                  <td className="px-6 py-5">
                    <div className="h-4 w-32 rounded bg-slate-100" />
                  </td>

                  <td className="px-6 py-5">
                    <div className="h-4 w-24 rounded bg-slate-100" />
                  </td>

                  <td className="px-6 py-5">
                    <div className="h-6 w-16 rounded-full bg-slate-200" />
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <p className="text-base font-semibold text-text-primary">
                      No records found
                    </p>

                    <p className="mt-2 text-sm text-text-secondary">
                      {search || Object.values(filters).some(Boolean)
                        ? "No records match your search or selected filters. Try adjusting your criteria."
                        : "There are no records available for the selected reporting period."}
                    </p>

                    {(search || Object.values(filters).some(Boolean)) && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary"
                      >
                        Clear search and filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  onClick={(event) => {
                    selectedRowRef.current = event.currentTarget;
                    setSelectedRecord(record);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectedRowRef.current = event.currentTarget;
                      setSelectedRecord(record);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for record ${record.id}`}
                  className="cursor-pointer hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-text-primary">
                    {formatDate(record.datetime)}
                  </td>

                  <td className="max-w-[220px] whitespace-normal break-words px-6 py-4 text-text-primary">
                    {record.street_name || "Location not recorded"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-text-secondary">
                    {record.age_range || "Not recorded"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-text-secondary">
                    {record.gender || "Not recorded"}
                  </td>

                  <td className="whitespace-normal break-words px-6 py-4 text-text-secondary">
                    {record.self_defined_ethnicity || "Not recorded"}
                  </td>

                  <td className="whitespace-normal break-words px-6 py-4 text-text-secondary">
                    {record.object_of_search || "Not recorded"}
                  </td>

                  <td className="whitespace-normal break-words px-6 py-4 text-text-secondary">
                    {record.outcome || "Not recorded"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        record.source_type === "located"
                          ? "bg-teal/10 text-teal"
                          : "bg-surface-secondary text-text-secondary"
                      }`}
                    >
                      {record.source_type === "located"
                        ? "Located"
                        : "Unlocated"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close record details"
            onClick={() => setSelectedRecord(null)}
            className="absolute inset-0 bg-black/40"
          />

          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-detail-title"
            className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-border bg-surface"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface p-4 sm:p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Record details
                </p>
                <h2
                  id="record-detail-title"
                  className="mt-1 text-lg font-semibold text-text-primary"
                >
                  Stop & Search Record
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close details"
                className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary"
              >
                Close
              </button>
            </div>

            <div className="space-y-8 p-4 sm:p-6">
              <section>
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  Record identification
                </h3>

                <div className="space-y-3">
                  <DetailItem label="Record ID" value={selectedRecord.id} />
                  <DetailItem
                    label="Reporting month"
                    value={selectedRecord.source_month}
                  />
                  <DetailItem
                    label="Date"
                    value={formatDate(selectedRecord.datetime)}
                  />
                  <DetailItem
                    label="Data classification"
                    value={selectedRecord.source_type}
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  Location
                </h3>

                <div className="space-y-3">
                  <DetailItem
                    label="Street"
                    value={selectedRecord.street_name}
                  />
                  <DetailItem
                    label="Latitude"
                    value={selectedRecord.latitude?.toString() ?? null}
                  />
                  <DetailItem
                    label="Longitude"
                    value={selectedRecord.longitude?.toString() ?? null}
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  Person information
                </h3>

                <div className="space-y-3">
                  <DetailItem
                    label="Age range"
                    value={selectedRecord.age_range}
                  />
                  <DetailItem label="Gender" value={selectedRecord.gender} />
                  <DetailItem
                    label="Self-defined ethnicity"
                    value={selectedRecord.self_defined_ethnicity}
                  />
                  <DetailItem
                    label="Officer-defined ethnicity"
                    value={selectedRecord.officer_defined_ethnicity}
                  />
                  <DetailItem
                    label="Involved person"
                    value={
                      selectedRecord.involved_person === null
                        ? null
                        : selectedRecord.involved_person === 1
                          ? "Yes"
                          : "No"
                    }
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  Search information
                </h3>

                <div className="space-y-3">
                  <DetailItem
                    label="Object of search"
                    value={selectedRecord.object_of_search}
                  />
                  <DetailItem
                    label="Search type"
                    value={selectedRecord.search_type}
                  />
                  <DetailItem
                    label="Legislation"
                    value={selectedRecord.legislation}
                  />
                  <DetailItem label="Outcome" value={selectedRecord.outcome} />
                  <DetailItem
                    label="Outcome linked to object of search"
                    value={
                      selectedRecord.outcome_linked_to_object_of_search === null
                        ? null
                        : selectedRecord.outcome_linked_to_object_of_search ===
                            1
                          ? "Yes"
                          : "No"
                    }
                  />
                  <DetailItem
                    label="More than outer clothing removed"
                    value={
                      selectedRecord.removal_of_more_than_outer_clothing ===
                      null
                        ? null
                        : selectedRecord.removal_of_more_than_outer_clothing ===
                            1
                          ? "Yes"
                          : "No"
                    }
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  Operation information
                </h3>

                <div className="space-y-3">
                  <DetailItem
                    label="Part of an operation"
                    value={
                      selectedRecord.operation === null
                        ? null
                        : selectedRecord.operation === 1
                          ? "Yes"
                          : "No"
                    }
                  />
                  <DetailItem
                    label="Operation name"
                    value={selectedRecord.operation_name}
                  />
                </div>
              </section>

              <p className="border-t border-border pt-4 text-xs leading-relaxed text-text-secondary">
                This record contains information supplied through the Police.uk
                stop-and-search dataset. Missing fields indicate information
                that was not recorded in the available data.
              </p>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-sm text-text-secondary">
          Page {page} of {totalPages || 1}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
            className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page >= totalPages || loading || totalPages === 0}
            className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
