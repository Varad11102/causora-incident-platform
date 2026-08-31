"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIcon, AlertIcon, ArrowIcon, ArrowUpIcon, CheckIcon, ClockIcon,
  DatabaseIcon, GitBranchIcon, LayersIcon, LogoMark, RadioIcon, RefreshIcon,
  SearchIcon, ServerIcon, ShieldIcon, SparklesIcon,
} from "../components/icons";
import { Account, accountInitials, apiFetch, csrfFetch } from "../lib/auth";

const IncidentUniverse = dynamic(() => import("../components/incident-universe"), {
  ssr: false,
  loading: () => <div className="universe-loading"><span /></div>,
});

type Incident = {
  id: string; title: string; sourceService: string; sourceNode: string;
  severity: string; status: string; createdAt: string; updatedAt: string; summary: string;
};

type Filter = "ALL" | "ACTIVE" | "RESOLVED";

type IncidentOverview = {
  totalIncidents: number; activeIncidents: number; resolvedIncidents: number;
  criticalActiveIncidents: number; evidenceSignals: number; rankedHypotheses: number;
  resolutionRate: number; latestActivityAt: string | null;
};

const severityStyle: Record<string, string> = {
  CRITICAL: "border-red-400/20 bg-red-400/[.08] text-red-300",
  WARNING: "border-amber-300/20 bg-amber-300/[.08] text-amber-200",
  INFO: "border-sky-300/20 bg-sky-300/[.08] text-sky-200",
};

const severityDot: Record<string, string> = {
  CRITICAL: "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.55)]",
  WARNING: "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,.45)]",
  INFO: "bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,.45)]",
};

const pipeline = [
  { name: "Telemetry", detail: "Ingestion API", icon: RadioIcon },
  { name: "Kafka", detail: "Operational events", icon: GitBranchIcon },
  { name: "Incident service", detail: "Causal engine", icon: SparklesIcon },
  { name: "PostgreSQL", detail: "Durable history", icon: DatabaseIcon },
];

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function shortId(id: string) {
  return id.length > 12 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();
}

function DashboardSkeleton() {
  return <div className="divide-y divide-white/[.055]">{Array.from({ length: 6 }).map((_, index) => (
    <div key={index} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_140px_120px_80px] md:items-center lg:px-6">
      <div><div className="skeleton h-4 w-3/5 rounded" /><div className="skeleton mt-3 h-3 w-2/5 rounded" /></div>
      <div className="skeleton h-7 w-20 rounded-full" /><div className="skeleton h-5 w-16 rounded" /><div className="skeleton h-5 w-12 rounded" />
    </div>
  ))}</div>;
}

export default function Home() {
  const [account, setAccount] = useState<Account | null>(null);
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<IncidentOverview | null>(null);

  async function loadIncidents(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    setError("");
    try {
      const [response, overviewResponse] = await Promise.all([
        apiFetch("/api/v1/incidents?limit=100", { cache: "no-store" }),
        apiFetch("/api/v1/incidents/overview", { cache: "no-store" }),
      ]);
      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      setIncidents(await response.json());
      if (overviewResponse.ok) setOverview(await overviewResponse.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reach the incident API");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void apiFetch("/api/v1/auth/me", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) {
        window.location.replace("/login");
        return;
      }
      setAccount(await response.json());
      await loadIncidents();
    }).catch(() => setError("Unable to verify your secure session"));
  }, []);

  async function signOut() {
    try {
      await csrfFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  const active = incidents?.filter((incident) => incident.status !== "RESOLVED") ?? [];
  const critical = active.filter((incident) => incident.severity === "CRITICAL");
  const resolved = incidents?.filter((incident) => incident.status === "RESOLVED") ?? [];

  const filtered = useMemo(() => {
    if (!incidents) return [];
    const normalized = query.trim().toLowerCase();
    return incidents.filter((incident) => {
      const matchesFilter = filter === "ALL" || (filter === "ACTIVE" ? incident.status !== "RESOLVED" : incident.status === "RESOLVED");
      const matchesQuery = !normalized || [incident.title, incident.sourceService, incident.id].some((value) => value.toLowerCase().includes(normalized));
      return matchesFilter && matchesQuery;
    }).slice(0, 10);
  }, [filter, incidents, query]);

  const stats = [
    { label: "Active incidents", value: String(overview?.activeIncidents ?? active.length), note: (overview?.criticalActiveIncidents ?? critical.length) ? `${overview?.criticalActiveIncidents ?? critical.length} need attention` : "No critical incidents", icon: AlertIcon, tone: "text-red-300", graph: "M2 25 18 22 34 24 50 12 66 15 82 7 98 11" },
    { label: "Resolution rate", value: `${overview?.resolutionRate ?? (incidents?.length ? Math.round((resolved.length * 100) / incidents.length) : 0)}%`, note: `${overview?.resolvedIncidents ?? resolved.length} incidents resolved`, icon: ClockIcon, tone: "text-emerald-300", graph: "M2 7 18 12 34 10 50 17 66 15 82 23 98 20" },
    { label: "Evidence signals", value: overview ? String(overview.evidenceSignals) : "—", note: overview ? `${overview.rankedHypotheses} ranked hypotheses` : "Loading investigation totals", icon: DatabaseIcon, tone: "text-sky-300", graph: "M2 24 18 23 34 20 50 18 66 14 82 10 98 6" },
    { label: "Execution safety", value: "Locked", note: "Human approval required", icon: ShieldIcon, tone: "text-violet-300", graph: "M2 18 18 18 34 18 50 18 66 18 82 18 98 18" },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="app-grid pointer-events-none absolute inset-0" />
      <div className="aurora-field pointer-events-none absolute inset-x-0 top-0 h-[52rem]" />
      <div className="noise-layer pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-[1480px] px-4 pb-16 sm:px-6 lg:px-8">
        <nav className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/[.065] bg-[#080b0f]/75 backdrop-blur-xl">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-3" aria-label="Causora home">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/[.08] text-emerald-300 shadow-[0_0_30px_rgba(110,231,183,.08)] transition group-hover:bg-emerald-300/[.12]"><LogoMark className="h-5 w-5" /></span>
              <span className="text-[15px] font-semibold tracking-[-.01em]">causora<span className="text-emerald-300">.</span></span>
            </Link>
            <div className="hidden items-center gap-1 rounded-lg border border-white/[.055] bg-white/[.025] p-1 md:flex">
              <span className="rounded-md bg-white/[.075] px-3 py-1.5 text-xs font-medium text-white">Overview</span>
              <a href="#incidents" className="px-3 py-1.5 text-xs text-slate-500 transition hover:text-slate-200">Incidents</a>
              <a href="#topology" className="px-3 py-1.5 text-xs text-slate-500 transition hover:text-slate-200">Topology</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><span className="signal-dot h-1.5 w-1.5 rounded-full bg-emerald-300" />Live environment</div>
            <div className="h-5 w-px bg-white/[.08]" />
            <div className="hidden text-right sm:block"><p className="max-w-32 truncate text-[10px] font-medium text-slate-300">{account?.displayName ?? "Secure session"}</p><p className="mt-0.5 text-[9px] text-slate-700">{account?.role ?? "VIEWER"}</p></div>
            <button onClick={() => void signOut()} title="Sign out" aria-label="Sign out" className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-slate-700 to-slate-900 text-[10px] font-semibold text-slate-200 transition hover:border-red-300/25 hover:text-red-200">{account ? accountInitials(account.displayName) : "··"}</button>
          </div>
        </nav>

        <header className="grid items-center gap-9 pb-10 pt-10 lg:grid-cols-[minmax(0,.88fr)_minmax(480px,1.12fr)] lg:gap-12 lg:pb-14 lg:pt-14">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.045] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.19em] text-emerald-300/80"><ActivityIcon className="h-3.5 w-3.5" /> Incident intelligence / online</div>
            <h1 className="text-balance text-[44px] font-medium leading-[.98] tracking-[-.06em] text-white sm:text-6xl lg:text-[72px]">See the signal.<br /><span className="hero-gradient-text">Find the cause.</span></h1>
            <p className="mt-7 max-w-xl text-[15px] leading-7 text-slate-400 sm:text-base">Real-time telemetry becomes ranked, explainable incident intelligence—before your team loses the thread.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => void loadIncidents(true)} disabled={refreshing} className="premium-button premium-button-primary"><RefreshIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh intelligence</button>
              <a href="#incidents" className="premium-button premium-button-secondary">Explore incidents <ArrowIcon className="h-4 w-4" /></a>
              <a href="/health" target="_blank" rel="noreferrer" className="ml-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-600 transition hover:text-emerald-300"><span className="signal-dot h-1.5 w-1.5 rounded-full bg-emerald-300" /> API operational <ArrowUpIcon className="h-3.5 w-3.5" /></a>
            </div>
            <div className="mt-10 flex items-center gap-6 border-t border-white/[.055] pt-5 text-[9px] uppercase tracking-[.15em] text-slate-700">
              <span>Telemetry → evidence</span><span className="h-1 w-1 rounded-full bg-slate-800" /><span>Explainable ranking</span><span className="hidden h-1 w-1 rounded-full bg-slate-800 sm:block" /><span className="hidden sm:block">Approval gated</span>
            </div>
          </div>
          <IncidentUniverse
            active={overview?.activeIncidents ?? active.length}
            critical={overview?.criticalActiveIncidents ?? critical.length}
            evidence={overview?.evidenceSignals ?? 0}
            className="min-h-[430px] lg:min-h-[520px]"
          />
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return <article key={stat.label} className="metric-card panel-glow group relative overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d1117]/90 p-5 transition hover:-translate-y-1 hover:border-white/[.13]">
              <div className="flex items-start justify-between"><p className="text-xs font-medium text-slate-500">{stat.label}</p><Icon className={`h-4 w-4 ${stat.tone}`} /></div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div><p className="text-3xl font-medium tracking-[-.035em] text-white">{incidents === null && stat.label !== "Execution safety" ? "—" : stat.value}</p><p className="mt-2 whitespace-nowrap text-[11px] text-slate-500">{stat.note}</p></div>
                <svg viewBox="0 0 100 30" className={`h-8 w-24 ${stat.tone} opacity-70`} fill="none" aria-hidden="true"><path d={stat.graph} stroke="currentColor" strokeWidth="1.7" vectorEffect="non-scaling-stroke" /><path d={`${stat.graph} V30 H2 Z`} fill="currentColor" opacity=".06" /></svg>
              </div>
            </article>;
          })}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
          <section id="incidents" className="glass-panel panel-glow overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d1117]/90">
            <div className="border-b border-white/[.065] px-5 py-5 lg:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div><div className="flex items-center gap-2"><h2 className="text-base font-semibold tracking-[-.01em]">Incident stream</h2><span className="rounded-md border border-emerald-300/15 bg-emerald-300/[.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.15em] text-emerald-300">Live</span></div><p className="mt-1 text-xs text-slate-500">Persisted operational events, newest first</p></div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="relative block"><SearchIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search incidents" className="h-9 w-full rounded-lg border border-white/[.075] bg-black/20 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-300/30 sm:w-48" /></label>
                  <div className="flex rounded-lg border border-white/[.075] bg-black/20 p-1">{(["ALL", "ACTIVE", "RESOLVED"] as Filter[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${filter === item ? "bg-white/[.09] text-white" : "text-slate-600 hover:text-slate-300"}`}>{item}</button>)}</div>
                </div>
              </div>
            </div>

            {error && <div className="m-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[.06] p-4 text-sm text-red-200"><AlertIcon className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-medium">Incident API unavailable</p><p className="mt-1 text-xs text-red-200/60">{error}</p></div></div>}
            {!error && incidents === null && <DashboardSkeleton />}
            {!error && incidents !== null && filtered.length === 0 && <div className="px-6 py-16 text-center"><SearchIcon className="mx-auto h-6 w-6 text-slate-700" /><p className="mt-3 text-sm text-slate-400">No matching incidents</p><p className="mt-1 text-xs text-slate-600">Try another service, ID, or status.</p></div>}
            {!error && filtered.length > 0 && <div className="divide-y divide-white/[.055]">{filtered.map((incident) => (
              <Link key={incident.id} href={`/incident?id=${incident.id}`} className="incident-row group grid gap-4 px-5 py-4 transition hover:bg-white/[.025] md:grid-cols-[minmax(0,1fr)_140px_120px_80px] md:items-center lg:px-6">
                <div className="flex min-w-0 items-start gap-3.5"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${severityDot[incident.severity] ?? "bg-slate-500"}`} /><div className="min-w-0"><p className="truncate text-[13px] font-medium text-slate-200 transition group-hover:text-white">{incident.title}</p><div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[.09em] text-slate-600"><span className="font-mono">#{shortId(incident.id)}</span><span className="h-0.5 w-0.5 rounded-full bg-slate-700" /><span className="truncate normal-case tracking-normal">{incident.sourceService}</span></div></div></div>
                <span className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[.1em] ${severityStyle[incident.severity] ?? "border-slate-500/20 text-slate-400"}`}>{incident.severity}</span>
                <div className="flex items-center gap-2 text-xs text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${incident.status === "RESOLVED" ? "bg-emerald-400" : "bg-amber-300"}`} />{incident.status}</div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 md:justify-end"><span>{relativeTime(incident.createdAt)}</span><ArrowIcon className="h-4 w-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:text-emerald-300 group-hover:opacity-100" /></div>
              </Link>
            ))}</div>}
            <div className="flex items-center justify-between border-t border-white/[.065] px-5 py-4 text-[10px] text-slate-600 lg:px-6"><span>Showing {filtered.length} of {incidents?.length ?? 0} incidents</span><span>PostgreSQL · authenticated viewer</span></div>
          </section>

          <aside id="topology" className="space-y-6">
            <section className="glass-panel panel-glow overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d1117]/90 p-5">
              <div className="flex items-start justify-between"><div><h2 className="text-sm font-semibold">Signal path</h2><p className="mt-1 text-xs text-slate-500">End-to-end pipeline</p></div><LayersIcon className="h-4 w-4 text-emerald-300" /></div>
              <div className="relative mt-6"><div className="absolute bottom-5 left-[17px] top-5 w-px bg-gradient-to-b from-emerald-300/50 via-sky-300/25 to-transparent" />{pipeline.map((service) => { const Icon = service.icon; return <div key={service.name} className="relative flex items-center gap-4 pb-5 last:pb-0"><span className="relative z-10 grid h-9 w-9 place-items-center rounded-xl border border-white/[.08] bg-[#11171d] text-slate-400"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-slate-300">{service.name}</p><p className="mt-0.5 text-[10px] text-slate-600">{service.detail}</p></div><div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-300"><span className="signal-dot h-1 w-1 rounded-full bg-emerald-300" />ONLINE</div></div>; })}</div>
            </section>

            <section className="glass-panel panel-glow rounded-2xl border border-white/[.07] bg-[#0d1117]/90 p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400"><ShieldIcon className="h-4 w-4 text-violet-300" />Safety boundary</div>
              <h3 className="mt-4 text-xl font-medium leading-tight tracking-[-.025em]">Observe freely.<br />Act deliberately.</h3>
              <p className="mt-3 text-xs leading-5 text-slate-500">Incident access requires an account. Every remediation stays behind a separate role and human approval gate.</p>
              <div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-xl border border-emerald-300/10 bg-emerald-300/[.04] p-3"><CheckIcon className="h-4 w-4 text-emerald-300" /><p className="mt-2 text-[10px] text-slate-400">Reads enabled</p></div><div className="rounded-xl border border-violet-300/10 bg-violet-300/[.04] p-3"><ServerIcon className="h-4 w-4 text-violet-300" /><p className="mt-2 text-[10px] text-slate-400">Writes protected</p></div></div>
            </section>
          </aside>
        </div>

        <footer className="mt-10 flex flex-col gap-3 border-t border-white/[.055] pt-6 text-[10px] text-slate-700 sm:flex-row sm:items-center sm:justify-between"><p>CAUSORA / INCIDENT INTELLIGENCE PLATFORM</p><div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-300" />All systems operational</span><span>ap-south-1</span></div></footer>
      </div>
    </main>
  );
}
