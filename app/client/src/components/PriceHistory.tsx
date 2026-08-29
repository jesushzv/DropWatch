import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { dateLabel, formatMoney, money } from "@/lib/format";
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { History } from "lucide-react";
import { useMemo } from "react";

type WatchDetail = inferRouterOutputs<AppRouter>["watchedRecords"]["get"];

const priceChartConfig = { price: { label: "Logged price", color: "var(--chart-1)" } } satisfies ChartConfig;

/**
 * Lives in its own module and is loaded lazily from Home: recharts is the
 * single heaviest dependency in the client, and the chart only ever renders in
 * the watch detail view — never on the dashboard that loads first.
 */
export default function PriceHistory({ detail }: { detail: WatchDetail }) {
  const { record, prices } = detail;
  const chartData = useMemo(
    () => prices.map(entry => ({ label: dateLabel(entry.recordedAt), price: entry.priceCents / 100 })),
    [prices],
  );

  return (
    <section className="border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Price history</p>
          <h2 className="font-display mt-1 text-xl font-bold tracking-tight">Every logged price, in context.</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {prices.length} {prices.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      {chartData.length ? (
        <div className="mt-6">
          <ChartContainer config={priceChartConfig} className="h-[230px] w-full aspect-auto">
            <LineChart data={chartData} margin={{ left: -8, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="2 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={32} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={46} tickFormatter={value => `$${value}`} />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    hideLabel
                    indicator="line"
                    formatter={value => <span className="font-mono font-semibold">{money.format(Number(value))}</span>}
                  />
                }
              />
              <ReferenceLine
                y={record.thresholdCents / 100}
                stroke="var(--primary)"
                strokeDasharray="4 4"
                label={{ value: `Target ${formatMoney(record.thresholdCents)}`, position: "insideTopRight", fill: "var(--primary)", fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="var(--color-price)"
                strokeWidth={2.25}
                dot={{ fill: "var(--color-price)", r: 3 }}
                activeDot={{ r: 5, fill: "var(--color-price)" }}
              />
            </LineChart>
          </ChartContainer>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px w-5 border-t border-dashed border-primary" />
            Your target is shown as a dotted line.
          </div>
        </div>
      ) : (
        <div className="mt-6 flex min-h-[230px] flex-col items-center justify-center border border-dashed border-border bg-secondary/40 text-center">
          <History className="h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No price history yet</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
            Log a product price to start building a comparison you can rely on.
          </p>
        </div>
      )}
    </section>
  );
}
