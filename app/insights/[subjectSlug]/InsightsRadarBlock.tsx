"use client";

import type { RadarDatum } from "@/lib/subject-insights-pivot";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type RadarSeries = {
  dataKey: string;
  name: string;
  color: string;
  dashed?: boolean;
};

export function InsightsRadarBlock({
  data,
  series,
}: {
  data: RadarDatum[];
  series: RadarSeries[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--color-outline-variant, #45484c)" />
        <PolarAngleAxis
          dataKey="skillLabel"
          tick={{
            fill: "var(--color-on-surface-variant, #a9abaf)",
            fontSize: 10,
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tickCount={6}
          tick={{
            fill: "var(--color-on-surface-variant, #737679)",
            fontSize: 9,
          }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-container-high, #1c2024)",
            border: "1px solid rgba(115,118,121,0.35)",
            borderRadius: 8,
            fontSize: 11,
          }}
          formatter={(value: number | string, name: string) => [
            value === null ||
            value === "" ||
            (typeof value === "number" && Number.isNaN(value))
              ? "—"
              : typeof value === "number"
                ? value.toFixed(2)
                : String(value),
            name,
          ]}
        />
        {series.map((s) => (
          <Radar
            key={s.dataKey}
            name={s.name}
            dataKey={s.dataKey}
            stroke={s.color}
            fill={s.color}
            fillOpacity={s.dashed ? 0 : 0.15}
            strokeWidth={s.dashed ? 1.5 : 2}
            strokeDasharray={s.dashed ? "4 4" : undefined}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
