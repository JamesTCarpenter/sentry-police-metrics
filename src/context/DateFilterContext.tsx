"use client";

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface DateFilter {
  startMonth: string;
  endMonth: string;
}

interface DateFilterContextType {
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  isReady: boolean;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(
  undefined
);

const DEFAULT_FILTER: DateFilter = {
  startMonth: "",
  endMonth: "",
};

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);

  return () => {
    window.removeEventListener("popstate", callback);
  };
}

function getSearchSnapshot() {
  return window.location.search;
}

function getServerSnapshot() {
  return null;
}

function parseDateFilter(search: string | null): DateFilter {
  if (search === null) return DEFAULT_FILTER;

  const params = new URLSearchParams(search);

  const startMonth = params.get("startMonth") || "";
  const endMonth = params.get("endMonth") || "";

  const validStart = !startMonth || MONTH_PATTERN.test(startMonth);
  const validEnd = !endMonth || MONTH_PATTERN.test(endMonth);

  if (
    !validStart ||
    !validEnd ||
    (startMonth && endMonth && startMonth > endMonth)
  ) {
    return DEFAULT_FILTER;
  }

  return { startMonth, endMonth };
}

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const search = useSyncExternalStore(
    subscribe,
    getSearchSnapshot,
    getServerSnapshot
  );

  const dateFilter = parseDateFilter(search);

  const setDateFilter = useCallback((filter: DateFilter) => {
    const params = new URLSearchParams(window.location.search);

    if (filter.startMonth) {
      params.set("startMonth", filter.startMonth);
    } else {
      params.delete("startMonth");
    }

    if (filter.endMonth) {
      params.set("endMonth", filter.endMonth);
    } else {
      params.delete("endMonth");
    }

    const queryString = params.toString();

    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.pushState(null, "", newUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return (
    <DateFilterContext.Provider
      value={{
        dateFilter,
        setDateFilter,
        isReady: search !== null,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  const context = useContext(DateFilterContext);

  if (!context) {
    throw new Error("useDateFilter must be used within a DateFilterProvider");
  }

  return context;
}
