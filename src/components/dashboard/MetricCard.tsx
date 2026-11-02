import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export default function MetricCard({
  title,
  value,
  description,
  change,
  trend = "neutral",
}: MetricCardProps) {
  return (
    <article className="rounded-xl bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-medium text-text-secondary">{title}</h2>

        {change && (
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
              trend === "up"
                ? "bg-red-50 text-red-700"
                : trend === "down"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-surface-secondary text-text-secondary"
            }`}
          >
            {trend === "up" && <ArrowUpRight size={14} aria-hidden="true" />}
            {trend === "down" && (
              <ArrowDownRight size={14} aria-hidden="true" />
            )}
            {change}
          </span>
        )}
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums text-text-primary sm:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-text-secondary">
        {description}
      </p>
    </article>
  );
}
