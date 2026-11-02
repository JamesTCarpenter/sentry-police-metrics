"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Borough {
  borough_name: string;
  gss_code: string;
  total_searches: number;
}

interface BoroughBreakdownProps {
  data: Borough[];
}

export default function BoroughBreakdown({ data }: BoroughBreakdownProps) {
  return (
    <section className="rounded-xl bg-surface p-4 sm:p-5">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary sm:text-lg">
          Stop & Search by Borough
        </h2>

        <p className="mt-1 text-sm text-text-secondary">
          Recorded searches across the 33 Greater London boroughs.
        </p>
      </div>

      <div className="h-[760px] w-full sm:h-[900px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 4,
              right: 24,
              bottom: 4,
              left: 12,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--border-color)"
            />

            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-text)", fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString("en-GB")}
            />

            <YAxis
              type="category"
              dataKey="borough_name"
              width={125}
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--secondary-text)", fontSize: 11 }}
            />

            <Tooltip
              formatter={(value) => [
                Number(value).toLocaleString("en-GB"),
                "Recorded searches",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
              }}
            />

            <Bar
              dataKey="total_searches"
              fill="#087f8c"
              radius={[0, 4, 4, 0]}
              barSize={15}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 border-t border-border pt-4 text-xs text-text-secondary">
        Counts are based on records successfully assigned to a borough using
        geographic boundary matching. They are not adjusted for population size
        or other demographic factors.
      </p>
    </section>
  );
}
