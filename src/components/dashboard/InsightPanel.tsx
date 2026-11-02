import { Database, ExternalLink } from "lucide-react";

export default function InsightPanel() {
  return (
    <aside
      aria-labelledby="insight-title"
      className="flex h-full flex-col justify-between rounded-xl bg-[#EDF6F6] p-5 sm:p-6"
    >
      <div>
        <div className="mb-5 flex items-center gap-2">
          <Database size={19} className="text-teal" aria-hidden="true" />

          <span className="text-sm font-semibold text-teal">
            ABOUT THE DATA
          </span>
        </div>

        <h2
          id="insight-title"
          className="editorial-heading text-xl leading-tight text-navy sm:text-2xl"
        >
          Understanding the source
        </h2>

        <div className="my-5 h-1 w-12 rounded-full bg-teal" />

        <p className="text-sm leading-6 text-text-secondary">
          This dashboard uses official stop-and-search records published by the
          Metropolitan Police through the Police.uk open data platform.
        </p>

        <div className="mt-5 border-t border-[#D7E9EA] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy">
            Dataset coverage
          </p>

          <p className="mt-2 text-sm leading-6 text-text-secondary">
            September 2023 – July 2026
          </p>

          <p className="mt-3 text-xs leading-5 text-text-secondary">
            Records reflect reported stop-and-search activity. Some fields may
            be missing, and not every record includes geographical coordinates.
          </p>
        </div>
      </div>

      <a
        href="https://data.police.uk/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-fit items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
      >
        Explore Police.uk data
        <ExternalLink size={15} aria-hidden="true" />
      </a>
    </aside>
  );
}
