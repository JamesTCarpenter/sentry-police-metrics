"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface GenderCategory {
  category: string;
  total: number;
}

interface GenderDistributionProps {
  data: GenderCategory[];
}

const chartColours = ["#087F8C", "#527C9A", "#A5B7C5", "#DCE2E7"];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-GB").format(value);

export default function GenderDistribution({ data }: GenderDistributionProps) {
  const totalRecords = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <section className="rounded-xl bg-white p-4 sm:p-5">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary sm:text-lg">
          Gender distribution
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Recorded gender across all searches
        </p>
      </div>

      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="h-[220px] w-full sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="category"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((item, index) => (
                  <Cell
                    key={item.category}
                    fill={chartColours[index % chartColours.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) => [formatNumber(Number(value)), "Searches"]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #DCE2E7",
                }}
                itemStyle={{
                  color: "#087F8C",
                }}
                labelStyle={{
                  color: "#172B3A",
                  fontWeight: 600,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage =
              totalRecords > 0 ? (item.total / totalRecords) * 100 : 0;

            return (
              <div key={item.category} className="flex items-start gap-3">
                <span
                  className="mt-1.5 h-3 w-3 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: chartColours[index % chartColours.length],
                  }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-text-secondary">{item.category}</span>

                    <span className="shrink-0 font-medium tabular-nums text-text-primary">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-text-secondary">
                    {formatNumber(item.total)} searches
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
