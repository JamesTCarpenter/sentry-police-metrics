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

interface Location {
  location: string;
  total_searches: number;
}

interface TopLocationsProps {
  data: Location[];
}

export default function TopLocations({ data }: TopLocationsProps) {
  const chartData = data.map((item) => ({
    ...item,
    location: item.location.replace(/^On or near /, ""),
  }));

  return (
    <section className="rounded-xl bg-surface p-4 sm:p-5">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary sm:text-lg">
          Most Recorded Search Locations
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Top 10 location descriptions by recorded search volume.
        </p>
      </div>

      <div className="h-[380px] w-full sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 12 }}
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
              dataKey="location"
              width={150}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--secondary-text)", fontSize: 11 }}
            />

            <Tooltip
              formatter={(value) => [
                Number(value).toLocaleString("en-GB"),
                "Searches",
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
              barSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
