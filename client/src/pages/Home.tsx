import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { trpc } from "@/lib/trpc";
import { dismissTutorial, shouldShowTutorial } from "@/lib/tutorial";
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ArrowLeft, ArrowUpRight, BellRing, BookOpen, Check, ChevronRight, CircleAlert, ClipboardPlus, Clock3, ExternalLink, History, Loader2, Mail, Pause, Play, Plus, Radar, RefreshCw, SearchX, Sparkles, Tag, Trash2, X } from "lucide-react";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WatchRecord = RouterOutputs["watchedRecords"]["list"][number];
type WatchDetail = RouterOutputs["watchedRecords"]["get"];
type PriceSource = WatchRecord["sources"][number];

const priceChartConfig = { price: { label: "Logged price", color: "var(--chart-1)" } } satisfies ChartConfig;
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const sourceOptions: { id: PriceSource; label: string; note: string }[] = [
  { id: "google_shopping", label: "Google Shopping", note: "Compare trusted merchants" },
  { id: "amazon", label: "Amazon", note: "Amazon offers and product data" },
  { id: "ebay", label: "eBay", note: "eBay offers and product data" },
];

function formatMoney(cents?: number | null) { return typeof cents === "number" ? money.format(cents / 100) : "—"; }
function dateLabel(value: Date | string) { return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function dateTime(value: Date | string) { return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
function sourceLabel(source: PriceSource) { return sourceOptions.find(option => option.id === source)?.label ?? source; }

function statusAppearance(status: WatchRecord["status"]) {
  if (status === "triggered") return { label: "Target met", className: "border-primary/30 bg-primary/10 text-primary", icon: BellRing };
  if (status === "paused") return { label: "Paused", className: "border-border bg-secondary text-muted-foreground", icon: Pause };
  return { label: "Watching", className: "border-emerald-700/20 bg-emerald-700/10 text-emerald-800", icon: Radar };
}

export default function Home() { return <DashboardLayout><DropWatchWorkspace /></DashboardLayout>; }

function DropWatchWorkspace() {
  const [, setLocation] = useLocation();
  const [matchesDetailRoute, params] = useRoute("/watch/:id");
  const listQuery = trpc.watchedRecords.list.useQuery();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "triggered">("all");
  const records = listQuery.data ?? [];
  const filtered = useMemo(() => filter === "all" ? records : records.filter(record => record.status === filter), [filter, records]);
  const counts = useMemo(() => ({ all: records.length, active: records.filter(record => record.status === "active").length, paused: records.filter(record => record.status === "paused").length, triggered: records.filter(record => record.status === "triggered").length }), [records]);

  if (matchesDetailRoute) return <RecordDetail recordId={Number(params?.id)} onBack={() => setLocation("/")} />;

  return (
    <div className="container max-w-[1144px] py-7 sm:py-10 lg:py-14">
      <header className="rise-in flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Your watchlist</p><h1 className="font-display mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Watch less. Know sooner.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Tell us what you want and the price you would pay. DropWatch watches the supported retailers for you.</p></div>
        <div className="flex items-center gap-3"><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("dropwatch:open-tutorial"))} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"><BookOpen className="h-3.5 w-3.5" />How it works</button><div className="hidden items-center gap-2 border border-border bg-secondary/55 px-3 py-2 text-xs text-muted-foreground sm:flex"><History className="h-3.5 w-3.5 text-primary" /><span>Every log stays in your record.</span></div></div>
      </header>
      <HowItWorks /><AlertBuilder onCreated={id => setLocation(`/watch/${id}`)} />
      <ImportAutomationPanel />
      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"><ImportHealthPanel /><NotificationPreferencesPanel /></section><PilotMetricsPanel />
      <section className="mt-10 rise-in" aria-labelledby="watchlist-heading">
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="watchlist-heading" className="font-display text-xl font-bold tracking-tight">Your watches</h2><p className="mt-1 text-sm text-muted-foreground">{records.length === 0 ? "Create your first precise alert." : `${records.length} saved ${records.length === 1 ? "watch" : "watches"}.`}</p></div><div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter watches">{(["all", "active", "paused", "triggered"] as const).map(item => <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filter === item ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:bg-secondary"}`}>{item === "all" ? "All" : item === "triggered" ? "Target met" : item[0].toUpperCase() + item.slice(1)} <span className="ml-1 opacity-70">{counts[item]}</span></button>)}</div></div>
        {listQuery.isLoading ? <WatchListSkeleton /> : listQuery.isError ? <ErrorPanel description="We could not load your watches. Check your connection, then try again." onRetry={() => listQuery.refetch()} /> : filtered.length ? <div className="mt-4 grid gap-3">{filtered.map(record => <WatchCard key={record.id} record={record} onOpen={() => setLocation(`/watch/${record.id}`)} />)}</div> : records.length ? <FilteredEmpty filter={filter} onReset={() => setFilter("all")} /> : <FirstWatchEmpty />}
      </section>
    </div>
  );
}

export function HowItWorks() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return shouldShowTutorial(window.localStorage);
  });

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("dropwatch:open-tutorial", show);
    return () => window.removeEventListener("dropwatch:open-tutorial", show);
  }, []);

  function dismiss() {
    setOpen(false);
    dismissTutorial(window.localStorage);
  }

  if (!open) return null;
  const steps = [
    ["1", "Create one watch", "Tell us the product and the price you would pay. You do not need to choose a store."],
    ["2", "We check the sources", "DropWatch checks supported retailers every six hours and records what each source found."],
    ["3", "Read the signal", "Open a watch to see the price, retailer, freshness, condition, and what is still unknown."],
  ];
  return <section className="rise-in mt-5 border border-primary/25 bg-primary/5 p-5 sm:p-6" aria-labelledby="tutorial-heading"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><BookOpen className="h-4 w-4" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Quick start</p><h2 id="tutorial-heading" className="font-display mt-1 text-lg font-bold tracking-tight">How DropWatch works</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Set a target once. We watch the supported retailers and keep the evidence in one place.</p></div></div><button type="button" onClick={dismiss} aria-label="Dismiss tutorial" className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-3 md:grid-cols-3">{steps.map(([number, title, description]) => <div key={number} className="border border-border/80 bg-background/70 p-4"><span className="font-mono text-xs font-bold text-primary">{number}</span><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Tip:</strong> Start with item price. Add delivered-cost settings later if you need stricter shipping and tax evidence.</p></section>;
}

export function AlertBuilder({ onCreated }: { onCreated: (id: number) => void }) {
  const utils = trpc.useUtils();
  const [request, setRequest] = useState("");
  const [manual, setManual] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({ productName: "", threshold: "" });
  const createFromRequest = trpc.watchedRecords.createFromRequest.useMutation();
  const create = trpc.watchedRecords.create.useMutation();
  const invalidate = () => utils.watchedRecords.list.invalidate();

  async function createWithLanguage(event: FormEvent) {
    event.preventDefault(); setError("");
    if (request.trim().length < 4) { setError("Describe what you want to watch in a few more words."); return; }
    try { const detail = await createFromRequest.mutateAsync({ request: request.trim() }); await invalidate(); toast.success("Watch created", { description: `${detail.record.productName} is now on your list.` }); setRequest(""); onCreated(detail.record.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "We could not read that request."); setManual(true); }
  }

  async function createManually(event: FormEvent) {
    event.preventDefault(); setError("");
    const thresholdCents = Math.round(Number(fields.threshold) * 100);
    if (fields.productName.trim().length < 2 || !Number.isInteger(thresholdCents) || thresholdCents <= 0) { setError("Add a product and a valid target price."); return; }
    try { const detail = await create.mutateAsync({ originalRequest: request.trim() || `Watch ${fields.productName} under $${fields.threshold} across supported retailers`, productName: fields.productName.trim(), stores: [], sources: sourceOptions.map(option => option.id), thresholdCents }); await invalidate(); toast.success("Watch created", { description: `${detail.record.productName} is now on your list.` }); setFields({ productName: "", threshold: "" }); setRequest(""); setManual(false); onCreated(detail.record.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "We could not create that watch."); }
  }

  const working = createFromRequest.isPending || create.isPending;
  return <section className="rise-in mt-7 border border-border bg-secondary/60 p-5 sm:p-6" aria-labelledby="builder-heading"><div className="flex gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Plain-English alert builder</p><h2 id="builder-heading" className="font-display mt-1 text-lg font-bold tracking-tight">What do you want to catch?</h2><p className="mt-1 text-sm text-muted-foreground">Start with one product and the price you would be happy to pay.</p></div></div>{!manual ? <form onSubmit={createWithLanguage} className="mt-5"><Textarea value={request} onChange={event => setRequest(event.target.value)} placeholder="Example: Sony WH-1000XM5 under $250" className="min-h-[78px] resize-none rounded-md bg-background text-sm leading-6" disabled={working} /><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => setManual(true)} className="text-left text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Prefer to enter the details yourself?</button><Button type="submit" disabled={working} className="rounded-md font-semibold">{working ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Structuring watch</> : <><Plus className="mr-2 h-4 w-4" />Create watch</>}</Button></div></form> : <form onSubmit={createManually} className="mt-5 grid gap-3 sm:grid-cols-[1.4fr_140px_auto]"><Input value={fields.productName} onChange={event => setFields(current => ({ ...current, productName: event.target.value }))} placeholder="Product name" disabled={working} /><Input value={fields.threshold} onChange={event => setFields(current => ({ ...current, threshold: event.target.value }))} inputMode="decimal" placeholder="Target price" aria-label="Target price in dollars" disabled={working} /><Button type="submit" disabled={working} className="rounded-md font-semibold">{working ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save watch"}</Button><button type="button" onClick={() => setManual(false)} className="sm:col-span-4 text-left text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Back to plain-English entry</button></form>}{error && <p role="alert" className="mt-4 flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm leading-5 text-destructive"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}</section>;
}

function ImportAutomationPanel() {
  const schedule = trpc.priceImports.getSchedule.useQuery();
  const enable = trpc.priceImports.enableRecurring.useMutation();
  const disable = trpc.priceImports.disableRecurring.useMutation();
  const requestNow = trpc.priceImports.requestNow.useMutation();
  const utils = trpc.useUtils();
  const isEnabled = schedule.data?.enabled === true;
  const isWorking = enable.isPending || disable.isPending || requestNow.isPending;
  const afterChange = () => Promise.all([utils.priceImports.getSchedule.invalidate(), utils.importHealth.list.invalidate()]);

  async function toggleRecurring() {
    try {
      if (isEnabled) {
        await disable.mutateAsync();
        toast.success("Recurring imports paused", { description: "Your watches will not be checked automatically until you resume them." });
      } else {
        await enable.mutateAsync();
        toast.success("Recurring imports enabled", { description: "Active watches will search supported US retailers every six hours." });
      }
      await afterChange();
    } catch (cause) {
      toast.error("Automated imports need a published app", { description: cause instanceof Error ? cause.message : "Try again after publishing DropWatch." });
    }
  }

  async function importNow() {
    try {
      const result = await requestNow.mutateAsync();
      await utils.importHealth.list.invalidate();
      toast.success(result.queued ? `${result.queued} price ${result.queued === 1 ? "check" : "checks"} requested` : "No active watches to check", {
        description: result.failures.length ? "Some checks could not be requested; review activity for details." : "The provider will add matching store prices to your history when ready.",
      });
    } catch (cause) {
      toast.error("Could not request price imports", { description: cause instanceof Error ? cause.message : "Try again after publishing DropWatch." });
    }
  }

  return <section className="rise-in mt-4 border border-border bg-card p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6" aria-labelledby="automation-heading"><div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary"><Clock3 className="h-4 w-4" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Automatic price checks</p><h2 id="automation-heading" className="font-display mt-1 text-lg font-bold tracking-tight">US retailer results, on a six-hour rhythm.</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">After you create a watch, DropWatch checks Google Shopping, Amazon, and eBay every six hours and records what each source found.</p>{schedule.isLoading ? <p className="mt-2 text-xs text-muted-foreground">Loading automation status…</p> : <p className="mt-2 text-xs font-medium text-muted-foreground">{isEnabled ? "Your active watches are checked every six hours." : "Turn on automatic checks when you are ready."}</p>}</div></div><div className="mt-5 flex shrink-0 flex-wrap gap-2 sm:mt-0"><Button variant="outline" onClick={importNow} disabled={isWorking} className="rounded-md bg-background"><RefreshCw className={`mr-2 h-4 w-4 ${requestNow.isPending ? "animate-spin" : ""}`} />Check now</Button><Button onClick={toggleRecurring} disabled={isWorking} className="rounded-md">{isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : isEnabled ? <><Pause className="mr-2 h-4 w-4" />Pause checks</> : <><Play className="mr-2 h-4 w-4" />Enable checks</>}</Button></div></section>;
}

function ImportHealthPanel() {
  const health = trpc.importHealth.list.useQuery();
  const latest = health.data ?? [];
  function state(item: (typeof latest)[number]) { return !item.latestJob ? { label: "Not checked", className: "text-muted-foreground" } : item.latestJob.status === "failed" ? { label: "Needs attention", className: "text-destructive" } : item.latestJob.status === "queued" ? { label: "Queued", className: "text-primary" } : item.latestJob.resultReason === "no_qualifying_offer" ? { label: "No qualifying offer", className: "text-muted-foreground" } : { label: "Checked", className: "text-emerald-800" }; }
  return <section className="border border-border bg-card p-5 sm:p-6" aria-labelledby="health-heading"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Import health</p><h2 id="health-heading" className="font-display mt-1 text-lg font-bold tracking-tight">See the check, not just the price.</h2></div><RefreshCw className={`mt-1 h-4 w-4 text-primary ${health.isFetching ? "animate-spin" : ""}`} /></div>{health.isLoading ? <div className="mt-5 h-16 animate-pulse bg-secondary/60" /> : health.isError ? <p className="mt-5 text-sm text-destructive">We could not load recent provider activity.</p> : latest.length ? <div className="mt-5 divide-y divide-border border-y border-border">{latest.map(item => { const itemState = state(item); const job = item.latestJob; return <div key={item.recordId} className="py-3 first:pt-3"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium">{item.productName}</p><span className={`shrink-0 text-xs font-semibold ${itemState.className}`}>{itemState.label}</span></div><p className="mt-1 text-xs text-muted-foreground">{job ? sourceLabel(job.source as PriceSource) : "No source check yet"}{job?.completedAt ? ` · ${dateTime(job.completedAt)}` : job ? " · waiting for result" : " · enable checks when ready"}</p>{job?.errorMessage && <p className="mt-1 truncate text-xs text-destructive">{job.errorMessage}</p>}{job?.resultReason === "no_qualifying_offer" && <p className="mt-1 text-xs text-muted-foreground">The provider completed the search but did not return an eligible offer.</p>}{item.jobs.length > 1 && <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">{item.jobs.map(sourceJob => <span key={sourceJob.providerJobId}>{sourceLabel(sourceJob.source as PriceSource)}: {sourceJob.status === "failed" ? "failed" : sourceJob.resultReason === "no_qualifying_offer" ? "no match" : sourceJob.status}</span>)}</div>}</div>; })}</div> : <p className="mt-5 text-sm leading-6 text-muted-foreground">No watches yet. Create a watch to begin tracking provider health.</p>}</section>;
}

function PilotMetricsPanel() {
  const metrics = trpc.pilot.metrics.useQuery();
  if (!metrics.data?.observationWatches) return null;
  return <section className="mt-4 border border-primary/20 bg-primary/5 p-5 sm:p-6" aria-labelledby="pilot-heading"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Observation pilot</p><div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h2 id="pilot-heading" className="font-display text-lg font-bold tracking-tight">Learn before you alert.</h2><p className="mt-1 text-sm text-muted-foreground">Observation watches record target matches without sending emails.</p></div><div className="flex gap-5 text-right"><div><p className="font-display text-xl font-bold">{metrics.data.observationWatches}</p><p className="text-[11px] text-muted-foreground">watches</p></div><div><p className="font-display text-xl font-bold">{metrics.data.recordedMatches}</p><p className="text-[11px] text-muted-foreground">matches recorded</p></div></div></div></section>;
}

function NotificationPreferencesPanel() {
  const preferences = trpc.notificationPreferences.get.useQuery();
  const update = trpc.notificationPreferences.update.useMutation();
  const utils = trpc.useUtils();
  const enabled = preferences.data?.priceAlertEmails ?? true;
  async function toggle() { try { const next = !enabled; await update.mutateAsync({ priceAlertEmails: next }); await utils.notificationPreferences.get.invalidate(); toast.success(next ? "Price-alert emails enabled" : "Price-alert emails paused", { description: next ? "DropWatch will email you when an active watch meets its target." : "Your in-app history and target events remain available." }); } catch { toast.error("We could not update email preferences."); } }
  return <section className="border border-border bg-secondary/45 p-5 sm:p-6" aria-labelledby="notifications-heading"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Mail className="h-4 w-4" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Email preferences</p><h2 id="notifications-heading" className="font-display mt-1 text-lg font-bold tracking-tight">Keep the signal, choose the channel.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Target-price emails are optional. You can also unsubscribe directly from any alert email.</p><div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4"><div><p className="text-sm font-semibold">Target-price emails</p><p className="mt-0.5 text-xs text-muted-foreground">{preferences.isLoading ? "Loading preference…" : enabled ? "On for your active watches" : "Off — in-app events remain on"}</p></div><Button type="button" variant={enabled ? "default" : "outline"} onClick={toggle} disabled={preferences.isLoading || update.isPending} className={`rounded-md ${enabled ? "" : "bg-background"}`}>{update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : enabled ? "On" : "Off"}</Button></div></section>;
}

function WatchCard({ record, onOpen }: { record: WatchRecord; onOpen: () => void }) {
  const status = statusAppearance(record.status); const Icon = status.icon; const hasCurrent = typeof record.currentPriceCents === "number";
  return <button onClick={onOpen} className={`group flex w-full flex-col gap-4 border bg-card p-4 text-left transition-colors hover:bg-secondary/45 sm:flex-row sm:items-center sm:gap-6 sm:p-5 ${record.status === "triggered" ? "border-primary/40" : "border-border"}`}><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}><Icon className="mr-1 h-3 w-3" />{status.label}</Badge><span className="text-xs text-muted-foreground">All supported retailers</span>{record.observationMode && <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">Observation mode</Badge>}</div><h3 className="font-display mt-3 truncate text-base font-bold tracking-tight sm:text-lg">{record.productName}</h3><p className="mt-1 truncate text-xs text-muted-foreground">{record.originalRequest}</p><p className="mt-2 text-[11px] font-medium text-muted-foreground">Searches: all supported retailer sources · Basis: {record.alertBasis === "verified_total" ? "verified delivered total" : record.alertBasis === "estimated_total" ? "estimated delivered total" : "item price"}</p></div><div className="grid grid-cols-2 gap-x-7 gap-y-1 border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Target</span><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Latest</span><strong className="font-display text-sm">{formatMoney(record.thresholdCents)}</strong><strong className={`font-display text-sm ${hasCurrent && record.currentPriceCents! <= record.thresholdCents ? "text-primary" : ""}`}>{hasCurrent ? formatMoney(record.currentPriceCents) : "No price yet"}</strong></div><ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></button>;
}

function TrustSummary({ record, price }: { record: WatchRecord; price?: WatchDetail["prices"][number] }) {
  const basis = record.alertBasis === "verified_total" ? "Verified delivered total" : record.alertBasis === "estimated_total" ? "Estimated delivered total" : "Item price";
  return <section className="mt-5 border border-border bg-secondary/35 p-4" aria-label="Trust evidence"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Trust evidence</p><span className="text-xs font-semibold text-foreground">{basis}</span></div><p className="mt-2 text-sm text-muted-foreground">{price ? `Latest offer: ${formatMoney(price.priceCents)} at ${price.store}.` : "No offer evidence has been recorded yet."} {record.destinationPostalCode ? `Destination ZIP ${record.destinationPostalCode}.` : "ZIP is stored as context; shipping and tax appear when the provider supplies them."}</p>{price && <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="border border-border bg-background px-2 py-1">Shipping {price.shippingCents === null ? "unknown" : formatMoney(price.shippingCents)}</span><span className="border border-border bg-background px-2 py-1">Tax {price.taxCents === null ? "unknown" : formatMoney(price.taxCents)}</span><span className="border border-border bg-background px-2 py-1">Condition {price.condition ?? "unknown"}</span><span className="border border-border bg-background px-2 py-1">Evidence {price.costConfidence}</span></div>}{record.observationMode && <p className="mt-3 text-xs font-medium text-primary">Observation mode is on: evidence is recorded without target emails.</p>}</section>;
}

function RecordDetail({ recordId, onBack }: { recordId: number; onBack: () => void }) {
  const utils = trpc.useUtils();
  const input = useMemo(() => ({ id: recordId }), [recordId]);
  const detailQuery = trpc.watchedRecords.get.useQuery(input, { enabled: Number.isInteger(recordId) && recordId > 0 });
  const setStatus = trpc.watchedRecords.setStatus.useMutation();
  const remove = trpc.watchedRecords.remove.useMutation();
  const [editing, setEditing] = useState(false);

  if (detailQuery.isLoading) return <div className="container max-w-[1144px] py-10"><DetailSkeleton /></div>;
  if (detailQuery.isError || !detailQuery.data) return <div className="container max-w-[1144px] py-10"><Button variant="ghost" onClick={onBack} className="mb-5 -ml-3"><ArrowLeft className="mr-2 h-4 w-4" />Back to watches</Button><ErrorPanel description="This watch could not be loaded. It may have been removed." onRetry={() => detailQuery.refetch()} /></div>;
  const detail = detailQuery.data;
  const { record } = detail;
  const status = statusAppearance(record.status); const StatusIcon = status.icon;
  const low = detail.prices.length ? Math.min(...detail.prices.map(entry => entry.priceCents)) : null;
  async function toggleStatus() { try { const next = record.status === "paused" ? "active" : "paused"; await setStatus.mutateAsync({ id: record.id, status: next }); await utils.watchedRecords.get.invalidate(input); await utils.watchedRecords.list.invalidate(); toast.success(next === "paused" ? "Watch paused" : "Watch resumed", { description: next === "paused" ? "You can still log prices while it is paused." : "Target checks are active again." }); } catch { toast.error("We could not update this watch."); } }
  async function removeRecord() { if (!window.confirm("Remove this watch from your dashboard? Its history will be preserved.")) return; try { await remove.mutateAsync({ id: record.id }); await utils.watchedRecords.list.invalidate(); toast.success("Watch removed", { description: "Its history remains safely stored." }); onBack(); } catch { toast.error("We could not remove this watch."); } }
  return <div className="container max-w-[1144px] py-7 sm:py-10 lg:py-14"><button onClick={onBack} className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" />All watches</button><header className="border-b border-border pb-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}><StatusIcon className="mr-1 h-3 w-3" />{status.label}</Badge><span className="text-xs text-muted-foreground">Created {dateLabel(record.createdAt)}</span></div><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{record.productName}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{record.originalRequest}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setEditing(current => !current)} className="rounded-md bg-background">{editing ? "Close edit" : "Edit watch"}</Button><Button variant="outline" onClick={toggleStatus} disabled={setStatus.isPending} className="rounded-md bg-background">{record.status === "paused" ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}{record.status === "paused" ? "Resume" : "Pause"}</Button><Button variant="outline" onClick={removeRecord} disabled={remove.isPending} className="rounded-md border-destructive/35 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Remove</Button></div></div><div className="mt-6 flex flex-wrap gap-x-4 gap-y-2"><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Radar className="h-3 w-3 text-primary" />All supported retailer sources</span></div></header>{editing && <EditWatch detail={detail} onClose={() => setEditing(false)} />}
    <section className="mt-7 grid gap-3 sm:grid-cols-3"><Metric label="Your target" value={formatMoney(record.thresholdCents)} /><Metric label="Current price" value={formatMoney(record.currentPriceCents)} emphasis={typeof record.currentPriceCents === "number" && record.currentPriceCents <= record.thresholdCents} /><Metric label="Lowest logged" value={formatMoney(low)} /></section><TrustSummary record={record} price={detail.prices[detail.prices.length - 1]} />
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]"><div className="space-y-8"><PriceHistory detail={detail} /><PriceLogger detail={detail} onLogged={() => { utils.watchedRecords.get.invalidate(input); utils.watchedRecords.list.invalidate(); }} /></div><ActivityPanel detail={detail} /></div></div>;
}

export function EditWatch({ detail, onClose }: { detail: WatchDetail; onClose: () => void }) {
  const utils = trpc.useUtils(); const update = trpc.watchedRecords.update.useMutation(); const record = detail.record;
  const [form, setForm] = useState({ originalRequest: record.originalRequest, productName: record.productName, threshold: String(record.thresholdCents / 100), alertBasis: record.alertBasis ?? "item_price", destinationPostalCode: record.destinationPostalCode ?? "", observationMode: record.observationMode ?? false }); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); const thresholdCents = Math.round(Number(form.threshold) * 100); if (form.productName.trim().length < 2 || !Number.isInteger(thresholdCents) || thresholdCents <= 0) { setError("Check the product and target price."); return; } if (form.destinationPostalCode && !/^\d{5}(-\d{4})?$/.test(form.destinationPostalCode)) { setError("Enter a valid US ZIP code."); return; } try { await update.mutateAsync({ id: record.id, originalRequest: form.originalRequest.trim(), productName: form.productName.trim(), stores: [], sources: sourceOptions.map(option => option.id), thresholdCents, alertBasis: form.alertBasis as "item_price" | "estimated_total" | "verified_total", destinationPostalCode: form.destinationPostalCode || undefined, observationMode: form.observationMode }); await utils.watchedRecords.get.invalidate({ id: record.id }); await utils.watchedRecords.list.invalidate(); toast.success("Watch updated", { description: "Your product, target, and trust settings are saved." }); onClose(); } catch { setError("We could not save those changes."); } }
  return <form onSubmit={submit} className="mt-6 border border-border bg-secondary/50 p-5"><div className="flex items-center justify-between"><h2 className="font-display text-base font-bold">Edit this watch</h2><button type="button" onClick={onClose} className="text-xs font-medium text-muted-foreground hover:text-foreground">Cancel</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Input value={form.productName} onChange={event => setForm(current => ({ ...current, productName: event.target.value }))} aria-label="Product name" /><Input value={form.threshold} onChange={event => setForm(current => ({ ...current, threshold: event.target.value }))} inputMode="decimal" aria-label="Target price" /><div className="sm:col-span-2"><Textarea value={form.originalRequest} onChange={event => setForm(current => ({ ...current, originalRequest: event.target.value }))} aria-label="Original watch request" className="min-h-[74px] resize-none bg-background" /></div><details className="sm:col-span-2"><summary className="cursor-pointer text-sm font-semibold text-foreground">Advanced alert settings <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span></summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-muted-foreground">Alert basis<select value={form.alertBasis} onChange={event => setForm(current => ({ ...current, alertBasis: event.target.value }))} className="mt-1 block w-full border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"><option value="item_price">Item price — simplest</option><option value="estimated_total">Estimated delivered total</option><option value="verified_total">Verified delivered total</option></select></label><label className="text-xs font-semibold text-muted-foreground">Destination ZIP (context only)<Input value={form.destinationPostalCode} onChange={event => setForm(current => ({ ...current, destinationPostalCode: event.target.value }))} inputMode="numeric" maxLength={10} aria-label="Destination ZIP" className="mt-1 bg-background font-normal" /></label><label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" checked={form.observationMode} onChange={event => setForm(current => ({ ...current, observationMode: event.target.checked }))} />Observation mode <span className="text-xs font-normal text-muted-foreground">Record evidence without sending target emails.</span></label></div></details></div>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<div className="mt-4 flex justify-end"><Button type="submit" disabled={update.isPending} className="rounded-md">{update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button></div></form>;
}

function PriceHistory({ detail }: { detail: WatchDetail }) { const { record, prices } = detail; const chartData = useMemo(() => prices.map(entry => ({ label: dateLabel(entry.recordedAt), price: entry.priceCents / 100 })), [prices]); return <section className="border border-border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Price history</p><h2 className="font-display mt-1 text-xl font-bold tracking-tight">Every logged price, in context.</h2></div><span className="text-xs text-muted-foreground">{prices.length} {prices.length === 1 ? "entry" : "entries"}</span></div>{chartData.length ? <div className="mt-6"><ChartContainer config={priceChartConfig} className="h-[230px] w-full aspect-auto"><LineChart data={chartData} margin={{ left: -8, right: 12, top: 8, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="2 4" /><XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={32} /><YAxis tickLine={false} axisLine={false} tickMargin={8} width={46} tickFormatter={value => `$${value}`} /><ChartTooltip cursor={{ stroke: "var(--border)", strokeWidth: 1 }} content={<ChartTooltipContent hideLabel indicator="line" formatter={value => <span className="font-mono font-semibold">{money.format(Number(value))}</span>} />} /><ReferenceLine y={record.thresholdCents / 100} stroke="var(--primary)" strokeDasharray="4 4" label={{ value: `Target ${formatMoney(record.thresholdCents)}`, position: "insideTopRight", fill: "var(--primary)", fontSize: 11 }} /><Line type="monotone" dataKey="price" stroke="var(--color-price)" strokeWidth={2.25} dot={{ fill: "var(--color-price)", r: 3 }} activeDot={{ r: 5, fill: "var(--color-price)" }} /></LineChart></ChartContainer><div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><span className="h-px w-5 border-t border-dashed border-primary" />Your target is shown as a dotted line.</div></div> : <div className="mt-6 flex min-h-[230px] flex-col items-center justify-center border border-dashed border-border bg-secondary/40 text-center"><History className="h-5 w-5 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No price history yet</p><p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Log a product price to start building a comparison you can rely on.</p></div>}</section>; }

function PriceLogger({ detail, onLogged }: { detail: WatchDetail; onLogged: () => void }) { const logPrice = trpc.watchedRecords.logPrice.useMutation(); const [form, setForm] = useState({ productUrl: "", price: "" }); const [error, setError] = useState(""); useEffect(() => setForm({ productUrl: "", price: "" }), [detail.record.id]); async function submit(event: FormEvent) { event.preventDefault(); setError(""); const priceCents = Math.round(Number(form.price) * 100); if (!form.productUrl.trim() || !Number.isInteger(priceCents) || priceCents <= 0) { setError("Paste the product URL and enter a valid price."); return; } try { const updated = await logPrice.mutateAsync({ id: detail.record.id, productUrl: form.productUrl.trim(), priceCents }); setForm(current => ({ ...current, productUrl: "", price: "" })); onLogged(); toast.success(updated.record.status === "triggered" ? "Target met — price drop recorded" : "Price recorded", { description: updated.record.dealVerdict || undefined }); } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not log that price."); } } return <section className="border border-border bg-secondary/50 p-5 sm:p-6"><div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><ClipboardPlus className="h-4 w-4" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Paste a price</p><h2 className="font-display mt-1 text-xl font-bold tracking-tight">Keep the history honest.</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Add the product link and the price you see now. DropWatch identifies the retailer from the link.</p></div></div><form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]"><Input type="url" value={form.productUrl} onChange={event => setForm(current => ({ ...current, productUrl: event.target.value }))} placeholder="https://store.com/product" aria-label="Product URL" disabled={logPrice.isPending} /><Input value={form.price} onChange={event => setForm(current => ({ ...current, price: event.target.value }))} inputMode="decimal" placeholder="Price in USD" aria-label="Price in USD" disabled={logPrice.isPending} /><Button type="submit" disabled={logPrice.isPending} className="rounded-md font-semibold">{logPrice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" />Log price</>}</Button></form>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}</section>; }

function ActivityPanel({ detail }: { detail: WatchDetail }) { const { record, events } = detail; return <aside className="border border-border bg-card p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Watch activity</p><h2 className="font-display mt-1 text-xl font-bold tracking-tight">The record, not the noise.</h2>{record.dealVerdict && <div className="mt-5 border-l-2 border-primary bg-secondary/50 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" />Deal read</div><p className="mt-2 text-sm leading-6 text-foreground">{record.dealVerdict}</p></div>}<div className="mt-6 space-y-0">{events.length ? events.map((event, index) => <div key={event.id} className="relative flex gap-3 pb-5 last:pb-0"><div className="flex flex-col items-center"><span className={`mt-1.5 h-2 w-2 rounded-full ${event.eventType === "threshold_met" ? "bg-primary" : "bg-border"}`} />{index < events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}</div><div className="min-w-0 pb-0.5"><p className="text-sm leading-5 text-foreground">{event.message}</p><p className="mt-1 text-[11px] text-muted-foreground">{dateTime(event.createdAt)}</p></div></div>) : <p className="mt-6 text-sm text-muted-foreground">Activity will appear as you update this watch.</p>}</div></aside>; }

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) { return <div className={`border p-4 ${emphasis ? "border-primary/40 bg-primary/10" : "border-border bg-card"}`}><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={`font-display mt-2 text-xl font-bold tracking-tight ${emphasis ? "text-primary" : ""}`}>{value}</p></div>; }
function ErrorPanel({ description, onRetry }: { description: string; onRetry: () => void }) { return <div className="mt-4 border border-destructive/30 bg-destructive/5 p-6 text-center"><CircleAlert className="mx-auto h-5 w-5 text-destructive" /><p className="mt-3 text-sm font-semibold">Something needs your attention</p><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p><Button variant="outline" onClick={onRetry} className="mt-4 rounded-md bg-background">Try again</Button></div>; }
function WatchListSkeleton() { return <div className="mt-4 grid gap-3">{[0, 1, 2].map(item => <div key={item} className="h-28 animate-pulse border border-border bg-secondary/45" />)}</div>; }
function DetailSkeleton() { return <div className="space-y-5"><div className="h-5 w-28 animate-pulse bg-secondary" /><div className="h-40 animate-pulse border border-border bg-secondary/45" /><div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map(item => <div key={item} className="h-24 animate-pulse border border-border bg-secondary/45" />)}</div><div className="h-72 animate-pulse border border-border bg-secondary/45" /></div>; }
function FirstWatchEmpty() { return <div className="mt-4 border border-dashed border-border bg-secondary/35 px-6 py-14 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-background text-primary"><Radar className="h-5 w-5" /></div><h3 className="font-display mt-4 text-lg font-bold">Your watchlist is ready.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Start with the one thing you have already decided to buy. DropWatch keeps the signal focused.</p></div>; }
function FilteredEmpty({ filter, onReset }: { filter: string; onReset: () => void }) { return <div className="mt-4 border border-dashed border-border bg-secondary/35 px-6 py-12 text-center"><SearchX className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">No {filter === "triggered" ? "target-met" : filter} watches right now.</p><button onClick={onReset} className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline">View all watches</button></div>; }
