'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmt, fmtShort } from '@/lib/format';

interface ChartTooltipEntry {
  name?: string | number;
  value?: number | string;
  payload?: Record<string, unknown>;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-bold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums text-muted-foreground">
          <span
            className="mr-1.5 inline-block size-2 rounded-full align-middle"
            style={{ background: (p.payload as { color?: string })?.color || 'var(--primary)' }}
          />
          {fmt(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

// ===================== BARRAS: GASTOS POR MÊS =====================
export function BarChartGastos({ data }: { data: { label: string; valor: number }[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            width={54}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickFormatter={(v: number) => fmtShort(v)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--primary-soft)' }} />
          <Bar dataKey="valor" radius={[7, 7, 0, 0]} maxBarSize={42}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={i === data.length - 1 ? 'var(--primary)' : 'color-mix(in oklab, var(--primary) 35%, transparent)'}
                fillOpacity={i === data.length - 1 ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ===================== ÁREA: EVOLUÇÃO INVESTIMENTOS =====================
export function AreaChartInvestimentos({
  data,
}: {
  data: { label: string; valor: number }[];
}) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--income)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--income)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            width={54}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickFormatter={(v: number) => fmtShort(v)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--income)', strokeOpacity: 0.3 }} />
          <Area
            type="monotone"
            dataKey="valor"
            stroke="var(--income)"
            strokeWidth={2.5}
            fill="url(#gradInv)"
            dot={{ r: 3, fill: 'var(--income)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ===================== PIZZA: GASTOS POR CATEGORIA =====================
export function DonutChartCategorias({
  data,
}: {
  data: { nome: string; valor: number; color: string }[];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="valor"
            nameKey="nome"
            innerRadius="58%"
            outerRadius="85%"
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
