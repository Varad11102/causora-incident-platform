"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CausalField from "../components/causal-field";
import { ArrowIcon, ArrowUpIcon, LogoMark, RefreshIcon, SearchIcon } from "../components/icons";
import { Account, accountInitials, apiFetch, csrfFetch } from "../lib/auth";

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

const pipeline = [
  ["01", "Telemetry", "Validated ingress"],
  ["02", "Kafka", "Durable event stream"],
  ["03", "Incident service", "Causal correlation"],
  ["04", "PostgreSQL", "Investigation memory"],
];

const severityClass: Record<string, string> = {
  CRITICAL: "severity-label severity-label--critical",
  WARNING: "severity-label severity-label--warning",
  INFO: "severity-label severity-label--info",
};

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
  return <div>{Array.from({ length: 6 }).map((_, index) => (
    <div key={index} className="grid min-h-[88px] grid-cols-[36px_minmax(0,1fr)] items-center gap-3 border-b border-black/15 px-4 sm:grid-cols-[36px_minmax(0,1fr)_110px_100px_70px]">
      <div className="skeleton h-3 w-4" /><div><div className="skeleton h-3 w-3/5" /><div className="skeleton mt-2 h-2 w-2/5" /></div><div className="skeleton hidden h-6 w-16 sm:block" /><div className="skeleton hidden h-3 w-14 sm:block" /><div className="skeleton hidden h-3 w-10 sm:block" />
    </div>
  ))}</div>;
}

export default function Home() {
  const [account, setAccount] = useState<Account | null>(null);
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [overview, setOverview] = useState<IncidentOverview | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  async function loadIncidents(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    setError("");
    try {
      const [response, overviewResponse] = await Promise.all([
        apiFetch("/api/v1/incidents?limit=100", { cache: "no-store" }),
        apiFetch("/api/v1/incidents/overview", { cache: "no-store" }),
      ]);
      if (response.status === 401) { window.location.replace("/login"); return; }
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
      if (!response.ok) { window.location.replace("/login"); return; }
      setAccount(await response.json());
      await loadIncidents();
    }).catch(() => setError("Unable to verify your secure session"));
  }, []);

  async function signOut() {
    try { await csrfFetch("/api/v1/auth/logout", { method: "POST" }); }
    finally { window.location.replace("/login"); }
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
    { index: "01", value: overview?.activeIncidents ?? active.length, label: `${overview?.criticalActiveIncidents ?? critical.length} require attention` },
    { index: "02", value: `${overview?.resolutionRate ?? (incidents?.length ? Math.round((resolved.length * 100) / incidents.length) : 0)}%`, label: "resolution rate" },
    { index: "03", value: overview?.evidenceSignals ?? "—", label: "correlated evidence signals" },
    { index: "04", value: "LOCKED", label: "execution / approval required" },
  ];

  return (
    <main className="min-h-screen">
      <div className="editorial-shell pb-16">
        <nav className="topbar">
          <div className="flex items-center gap-7">
            <Link href="/" className="wordmark" aria-label="Causora home">
              <span className="wordmark__mark"><LogoMark className="h-[18px] w-[18px]" /></span>
              <span>causora <sup className="wordmark__index">OPS/01</sup></span>
            </Link>
            <div className="hidden items-center gap-5 md:flex"><a className="utility-link" href="#incidents">Incidents</a><a className="utility-link" href="#system">System path</a></div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="live-key hidden sm:flex"><i /> ap-south-1 / live</span>
            <span className="hidden h-6 w-px bg-black/20 sm:block" />
            <div className="hidden text-right md:block"><p className="max-w-32 truncate text-[11px] font-bold">{account?.displayName ?? "Secure session"}</p><p className="mt-0.5 font-mono text-[8px] uppercase tracking-[.1em] text-black/45">{account?.role ?? "VIEWER"}</p></div>
            <button onClick={() => void signOut()} title="Sign out" aria-label="Sign out" className="grid h-9 w-9 place-items-center border border-black bg-transparent text-[10px] font-bold transition hover:bg-[#ff5c35]">{account ? accountInitials(account.displayName) : "··"}</button>
          </div>
        </nav>

        <header className="grid border-b border-black lg:grid-cols-[minmax(0,.85fr)_minmax(520px,1.15fr)]">
          <div className="flex min-h-[500px] flex-col justify-between border-black py-10 pr-4 lg:border-r lg:py-14 lg:pr-12">
            <span className="eyebrow">Incident intelligence / index 07</span>
            <div className="mt-20 lg:mt-0">
              <h1 className="display-type max-w-[720px] text-[64px] leading-[.82] sm:text-[86px] lg:text-[100px]">Find the fault<br /><em className="font-normal text-[#ff5c35]">behind</em> the noise.</h1>
              <div className="mt-9 grid gap-6 border-t border-black/25 pt-5 sm:grid-cols-[minmax(0,1fr)_210px]">
                <p className="max-w-lg text-[13px] leading-6 text-black/60">A forensic operations workspace that turns telemetry into durable evidence, ranked causes, and approval-controlled action.</p>
                <p className="font-mono text-[9px] uppercase leading-5 tracking-[.08em] text-black/45">Telemetry &rarr; Kafka &rarr;<br />Evidence &rarr; Cause</p>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                <button onClick={() => void loadIncidents(true)} disabled={refreshing} className="button-solid"><RefreshIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh field</button>
                <a href="#incidents" className="button-line">Open incident index <ArrowIcon className="h-4 w-4" /></a>
              </div>
            </div>
          </div>
          <div className="py-4 lg:py-8 lg:pl-8"><CausalField active={overview?.activeIncidents ?? active.length} critical={overview?.criticalActiveIncidents ?? critical.length} evidence={overview?.evidenceSignals ?? 0} /></div>
        </header>

        <section className="stats-band" aria-label="Incident overview">
          {stats.map((stat) => <article key={stat.index} className="stat-cell"><span className="stat-cell__index">{stat.index} / LIVE MEASURE</span><p className="stat-cell__value">{incidents === null && stat.index !== "04" ? "—" : stat.value}</p><p className="stat-cell__label">{stat.label}</p></article>)}
        </section>

        <div className="mt-16 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section id="incidents">
            <div className="section-rule"><h2>Incident index</h2><p>{String(filtered.length).padStart(2, "0")} visible / {String(incidents?.length ?? 0).padStart(3, "0")} total</p></div>
            <div className="data-panel mt-4">
              <div className="data-panel__head flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="relative block"><SearchIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by service, title, or ID" className="search-field w-full pl-9 pr-3 md:w-[290px]" /></label>
                <div className="filter-strip">{(["ALL", "ACTIVE", "RESOLVED"] as Filter[]).map((item) => <button key={item} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}</div>
              </div>

              {error && <div role="alert" className="border-b border-black bg-[#ff5c35] p-4 text-xs"><strong>Incident API unavailable.</strong> <span className="ml-2 opacity-70">{error}</span></div>}
              {!error && incidents === null && <DashboardSkeleton />}
              {!error && incidents !== null && filtered.length === 0 && <div className="px-6 py-20 text-center"><p className="display-type text-4xl">No signal found.</p><p className="mt-2 text-xs text-black/50">Try another service, ID, or status.</p></div>}
              {!error && filtered.length > 0 && <div>{filtered.map((incident, index) => (
                <Link key={incident.id} href={`/incident?id=${incident.id}`} className="incident-line grid-cols-[36px_minmax(0,1fr)] gap-3 px-4 sm:grid-cols-[36px_minmax(0,1fr)_110px_100px_70px]">
                  <span className="incident-line__number">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0"><p className="incident-line__title truncate">{incident.title}</p><p className="incident-line__meta">#{shortId(incident.id)} / {incident.sourceService}</p></div>
                  <span className={`${severityClass[incident.severity] ?? "severity-label"} hidden sm:block`}>{incident.severity}</span>
                  <span className={`status-word hidden sm:flex ${incident.status === "RESOLVED" ? "status-word--resolved" : "status-word--open"}`}><i />{incident.status}</span>
                  <span className="hidden items-center justify-end gap-2 font-mono text-[9px] text-black/45 sm:flex">{relativeTime(incident.createdAt)} <ArrowIcon className="h-3.5 w-3.5" /></span>
                </Link>
              ))}</div>}
              <div className="flex items-center justify-between border-t border-black px-4 py-3 font-mono text-[8px] uppercase tracking-[.08em] text-black/45"><span>PostgreSQL / authenticated</span><span>Newest first</span></div>
            </div>
          </section>

          <aside id="system" className="space-y-5 xl:sticky xl:top-24">
            <section className="ink-panel p-5">
              <div className="flex items-start justify-between border-b border-white/20 pb-4"><div><span className="eyebrow eyebrow--inverse">System path</span><p className="mt-3 text-[11px] text-white/40">End-to-end processing state</p></div><span className="font-mono text-[8px] text-[#d9ff43]">04/04 ONLINE</span></div>
              <div className="mt-1">{pipeline.map(([index, name, detail]) => <div className="pipeline-row" key={index}><span className="pipeline-row__index">{index}</span><div><h3>{name}</h3><p>{detail}</p></div><span className="pipeline-row__state">READY</span></div>)}</div>
            </section>
            <section className="safety-note p-5">
              <span className="eyebrow">Safety boundary</span>
              <h3 className="display-type mt-12 text-4xl leading-[.9]">Read broadly.<br />Act narrowly.</h3>
              <p className="mt-5 max-w-[260px] text-[11px] leading-5 text-black/65">Every write remains behind a separate role and explicit human approval. Execution is disabled by default.</p>
              <a href="/health" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 border-b border-black pb-1 text-[10px] font-bold">Inspect API health <ArrowUpIcon className="h-3.5 w-3.5" /></a>
            </section>
          </aside>
        </div>

        <footer className="mt-16 flex flex-col gap-3 border-t border-black py-5 font-mono text-[8px] uppercase tracking-[.09em] text-black/45 sm:flex-row sm:items-center sm:justify-between"><p>Causora / incident intelligence platform</p><p>Java 21 / Kafka / PostgreSQL / Next.js</p></footer>
      </div>
    </main>
  );
}
