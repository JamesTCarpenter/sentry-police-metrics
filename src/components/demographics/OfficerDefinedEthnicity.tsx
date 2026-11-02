"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface EthnicityCategory {
  category: string;
  total: number;
}

interface OfficerDefinedEthnicityProps {
  data: EthnicityCategory[];
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-GB").format(value);

export default function OfficerDefinedEthnicity({
  data,
}: OfficerDefinedEthnicityProps) {
  const chartData = [...data].sort((a, b) => b.total - a.total);

  const totalRecords = chartData.reduce((sum, item) => sum + item.total, 0);

  return (
    <section className="rounded-xl bg-white p-4 sm:p-5">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary sm:text-lg">
          Officer-defined ethnicity
        </h2>

        <p className="mt-1 text-sm text-text-secondary">
          Ethnicity recorded as perceived by the searching officer
        </p>
      </div>

      <div className="h-[260px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 25, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              stroke="#E8EDF0"
              strokeDasharray="3 3"
              horizontal={false}
            />

            <XAxis
              type="number"
              tickFormatter={(value) => `${value / 1000}k`}
              tick={{ fill: "#526477", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="category"
              width={90}
              tick={{ fill: "#526477", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              formatter={(value) => [formatNumber(Number(value)), "Searches"]}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #DCE2E7",
              }}
            />

            <Bar
              dataKey="total"
              fill="#087F8C"
              radius={[0, 5, 5, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        {chartData.map((item) => (
          <div
            key={item.category}
            className="flex justify-between gap-4 text-xs"
          >
            <span className="text-text-secondary">{item.category}</span>

            <span className="shrink-0 font-medium tabular-nums text-text-primary">
              {totalRecords > 0
                ? ((item.total / totalRecords) * 100).toFixed(1)
                : "0.0"}
              %
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-text-secondary">
        This represents officer-recorded perceptions, not self-identified
        ethnicity.
      </p>
    </section>
  );
}
