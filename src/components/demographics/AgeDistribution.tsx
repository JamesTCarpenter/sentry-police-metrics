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

interface AgeCategory {
  category: string;
  total: number;
}

interface AgeDistributionProps {
  data: AgeCategory[];
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-GB").format(value);

export default function AgeDistribution({ data }: AgeDistributionProps) {
  const chartData = [...data].sort((a, b) => b.total - a.total);

  return (
    <section className="rounded-xl bg-white p-4 sm:p-5">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary sm:text-lg">
          Age distribution
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Number of searches by recorded age category
        </p>
      </div>

      <div className="h-[280px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
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
    </section>
  );
}
