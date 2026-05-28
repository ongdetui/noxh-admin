import { adminAiApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: decimals });
}

function DailyChart({
  data,
}: {
  data: { date: string; count: number; costUsd: number }[];
}) {
  if (!data.length) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const BAR_W = 24;
  const GAP = 6;
  const H = 120;
  const BOTTOM = 24;
  const totalW = data.length * (BAR_W + GAP);

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(totalW, 400)}
        height={H + BOTTOM}
        className="text-primary"
      >
        {data.map((d, i) => {
          const barH = Math.max((d.count / maxCount) * H, d.count > 0 ? 2 : 0);
          const x = i * (BAR_W + GAP);
          const y = H - barH;
          const label =
            d.date.slice(5); // MM-DD
          return (
            <g key={d.date}>
              <title>
                {d.date}: {d.count} lần · ${d.costUsd.toFixed(4)}
              </title>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={3}
                className="fill-primary opacity-80 hover:opacity-100 transition-opacity"
              />
              {data.length <= 31 && (
                <text
                  x={x + BAR_W / 2}
                  y={H + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                  fontSize={9}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AiAnalyticsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-stats", dateFrom, dateTo],
    queryFn: () => adminAiApi.stats({ dateFrom, dateTo }),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <p className="text-[32px] font-semibold text-foreground m-0!">
          AI Analytics
        </p>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={dateFrom}
            max={dateTo}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground focus:outline-none focus-visible:border-ring"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground focus:outline-none focus-visible:border-ring"
          />
        </div>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Tổng lần phân tích"
              value={fmt(data.totalAnalyses)}
            />
            <StatCard
              label="Người dùng duy nhất"
              value={fmt(data.uniqueUsers)}
            />
            <StatCard
              label="Tổng token dùng"
              value={fmt(data.totalTokensUsed)}
              sub={`~${fmt(data.averageTokensPerAnalysis, 0)} token/lần`}
            />
            <StatCard
              label="Tổng chi phí (USD)"
              value={`$${data.totalCostUsd.toFixed(4)}`}
              sub={`~$${data.averageCostPerAnalysis.toFixed(4)}/lần`}
            />
          </div>

          {/* Daily chart */}
          {data.analysesByDay.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Phân tích theo ngày
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.analysesByDay.length} ngày
                </p>
              </div>
              <DailyChart data={data.analysesByDay} />
            </div>
          )}

          {/* Cost breakdown table */}
          {data.analysesByDay.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Ngày", "Số lần phân tích", "Chi phí (USD)"].map(
                        (col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left font-medium text-muted-foreground"
                          >
                            {col}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...data.analysesByDay]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((day) => (
                        <tr
                          key={day.date}
                          className="bg-card hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-foreground">
                            {day.date}
                          </td>
                          <td className="px-4 py-2.5">{fmt(day.count)}</td>
                          <td className="px-4 py-2.5">
                            ${day.costUsd.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
