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

interface SelfDefinedEthnicityProps {
  data: EthnicityCategory[];
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-GB").format(value);

export default function SelfDefinedEthnicity({
  data,
}: SelfDefinedEthnicityProps) {
  const chartData = [...data].sort((a, b) => b.total - a.total);

  const formatCategory = (category: string) => {
    const maxLength = 22;

    return category.length > maxLength
      ? `${category.slice(0, maxLength - 1)}…`
      : category;
  };

  return (
    <section className="rounded-xl bg-white p-4 sm:p-5">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary sm:text-lg">
          Self-defined ethnicity
        </h2>

        <p className="mt-1 text-sm text-text-secondary">
          Ethnicity recorded as provided by the person searched
        </p>
      </div>

      <div className="h-[620px] w-full min-w-0 sm:h-[680px]">
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
              width={150}
              interval={0}
              tick={({ x, y, payload }) => (
                <text
                  x={x}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="#526477"
                  fontSize={11}
                >
                  <title>{payload.value}</title>
                  {formatCategory(String(payload.value))}
                </text>
              )}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              labelFormatter={(label) => String(label)}
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
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-text-secondary">
        Includes all recorded categories, including not stated and not recorded.
      </p>
    </section>
  );
}
