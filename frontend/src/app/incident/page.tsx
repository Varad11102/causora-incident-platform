"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIcon, AlertIcon, ArrowUpIcon, CheckIcon, ChevronLeftIcon, ClockIcon,
  CopyIcon, DatabaseIcon, GitBranchIcon, LogoMark, ShieldIcon, SparklesIcon,
} from "../../components/icons";

type Incident = {
  id: string; createdAt: string; updatedAt: string; status: string; severity: string;
  title: string; sourceService: string; sourceNode: string; triggeringEventId: string; summary: string;
};

type Evidence = {
  id: string; observedAt: string; sourceType: string; sourceService: string; sourceNode: string;
  evidenceType: string; severity: string; key: string; value: string; traceId?: string;
  deploymentId?: string; confidence: number;
};

type Hypothesis = {
  id: string; hypothesisType: string; title: string; score: number; explanation: string;
  supportingEvidenceIds?: string[]; counterEvidenceIds?: string[];
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://13-207-12-164.sslip.io";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
}

function formatType(value: string) {
  return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function duration(start: string, end: string) {
  const seconds = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function recommendationFor(hypothesis?: Hypothesis) {
  if (!hypothesis) return "Review the correlated evidence and validate the affected service before approving an action.";
  if (hypothesis.hypothesisType.includes("DEPLOYMENT")) return "Roll back the correlated deployment, restore the last known-good configuration, and verify service recovery.";
  if (hypothesis.hypothesisType.includes("DATABASE")) return "Restore database connectivity, validate credentials and network policy, then replay a health check.";
  if (hypothesis.hypothesisType.includes("KAFKA")) return "Inspect consumer lag and partition health, then restart only the affected consumer group if required.";
  return "Validate the highest-ranked cause against supporting evidence before initiating the protected remediation workflow.";
}

function DetailSkeleton() {
  return <div className="mt-10 space-y-5"><div className="skeleton h-5 w-40 rounded" /><div className="skeleton h-14 max-w-3xl rounded-xl" /><div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-24 rounded-2xl" />)}</div><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="skeleton h-96 rounded-2xl" /><div className="skeleton h-80 rounded-2xl" /></div></div>;
}

export default function LiveIncidentDetail() {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setError("This link is missing an incident ID."); return; }

    Promise.all([
      fetch(`${apiBase}/api/v1/incidents/${id}`).then((response) => response.ok ? response.json() : Promise.reject(new Error(`Incident API returned ${response.status}`))),
      fetch(`${apiBase}/api/v1/incidents/${id}/evidence`).then((response) => response.ok ? response.json() : []),
      fetch(`${apiBase}/api/v1/incidents/${id}/hypotheses`).then((response) => response.ok ? response.json() : []),
    ]).then(([incidentItem, evidenceItems, hypothesisItems]) => {
      setIncident(incidentItem);
      setEvidence(evidenceItems);
      setHypotheses(hypothesisItems);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load this investigation"));
  }, []);

  const rankedHypotheses = useMemo(() => [...hypotheses].sort((a, b) => b.score - a.score), [hypotheses]);
  const timeline = useMemo(() => [...evidence].sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()), [evidence]);
  const topHypothesis = rankedHypotheses[0];

  async function copyIncidentId() {
    if (!incident) return;
    await navigator.clipboard.writeText(incident.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="app-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-[1380px] px-4 pb-16 sm:px-6 lg:px-8">
        <nav className="flex h-20 items-center justify-between border-b border-white/[.065]">
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-3" aria-label="Causora home"><span className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/[.08] text-emerald-300"><LogoMark className="h-5 w-5" /></span><span className="text-[15px] font-semibold">causora<span className="text-emerald-300">.</span></span></Link>
            <span className="hidden h-5 w-px bg-white/[.08] sm:block" />
            <span className="hidden text-xs text-slate-600 sm:block">Investigation workspace</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-3 py-1.5 text-[10px] font-semibold text-emerald-300"><span className="signal-dot h-1.5 w-1.5 rounded-full bg-emerald-300" />LIVE DATA</div>
        </nav>

        {error && <section className="mx-auto mt-24 max-w-xl rounded-2xl border border-red-400/20 bg-[#0d1117] p-8 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-red-400/[.08] text-red-300"><AlertIcon /></span><h1 className="mt-5 text-2xl font-medium">Investigation unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link href="/" className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-emerald-300"><ChevronLeftIcon className="h-4 w-4" />Return to incidents</Link></section>}
        {!error && !incident && <DetailSkeleton />}

        {incident && <>
          <div className="pb-8 pt-8">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-200"><ChevronLeftIcon className="h-4 w-4" />Back to incident stream</Link>
          </div>

          <header className="panel-glow relative overflow-hidden rounded-3xl border border-white/[.075] bg-[#0d1117]/95 p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-red-400/[.035] blur-3xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-red-400/20 bg-red-400/[.08] px-2.5 py-1 text-[9px] font-bold tracking-[.12em] text-red-300">{incident.severity}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[.12em] ${incident.status === "RESOLVED" ? "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300" : "border-amber-300/20 bg-amber-300/[.07] text-amber-200"}`}>{incident.status}</span>
                  <span className="text-[10px] text-slate-600">Opened {formatDate(incident.createdAt)}</span>
                </div>
                <h1 className="text-balance mt-6 text-3xl font-medium leading-[1.1] tracking-[-.035em] text-white sm:text-4xl lg:text-5xl">{incident.title}</h1>
                <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-400 sm:text-[15px]">{incident.summary}</p>
              </div>
              <button onClick={() => void copyIncidentId()} className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.035] px-3.5 py-2.5 text-[10px] font-medium text-slate-400 transition hover:bg-white/[.06] hover:text-white"><CopyIcon className="h-3.5 w-3.5" />{copied ? "Copied" : `#${incident.id.slice(0, 8).toUpperCase()}`}</button>
            </div>

            <div className="relative mt-9 grid gap-px overflow-hidden rounded-2xl border border-white/[.065] bg-white/[.065] sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Affected service", value: incident.sourceService, icon: ActivityIcon },
                { label: "Source node", value: incident.sourceNode, icon: DatabaseIcon },
                { label: "Evidence window", value: duration(incident.createdAt, incident.updatedAt), icon: ClockIcon },
                { label: "Top confidence", value: topHypothesis ? `${topHypothesis.score}%` : "Pending", icon: SparklesIcon },
              ].map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="bg-[#0b0f14] px-4 py-4"><div className="flex items-center gap-2 text-[10px] text-slate-600"><Icon className="h-3.5 w-3.5" />{metric.label}</div><p className="mt-2 truncate text-xs font-medium text-slate-300">{metric.value}</p></div>; })}
            </div>
          </header>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="panel-glow overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d1117]/90">
              <div className="flex items-center justify-between border-b border-white/[.065] px-5 py-5 sm:px-6"><div><h2 className="text-base font-semibold">Evidence timeline</h2><p className="mt-1 text-xs text-slate-500">Correlated signals in observation order</p></div><span className="rounded-lg bg-white/[.05] px-2.5 py-1 text-[10px] text-slate-400">{timeline.length} records</span></div>
              <ol className="px-5 py-2 sm:px-6">
                {timeline.map((item, index) => (
                  <li key={item.id} className="group relative grid grid-cols-[22px_minmax(0,1fr)] gap-4 py-5">
                    {index < timeline.length - 1 && <span className="absolute bottom-0 left-[10px] top-8 w-px bg-white/[.07]" />}
                    <span className={`relative z-10 mt-1.5 h-[9px] w-[9px] rounded-full ring-4 ring-[#0d1117] ${item.severity === "CRITICAL" || item.severity === "ERROR" ? "bg-red-400" : item.evidenceType === "RECOVERY" ? "bg-emerald-300" : "bg-sky-300"}`} />
                    <article>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-300">{formatType(item.evidenceType)}</span><span className="text-[10px] text-slate-600">{formatDate(item.observedAt)}</span></div>
                      <p className="mt-2 text-[13px] leading-6 text-slate-400">{item.value}</p>
                      <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-md border border-white/[.06] bg-white/[.025] px-2 py-1 text-[9px] text-slate-600">{item.sourceService}</span>{item.deploymentId && <span className="max-w-[240px] truncate rounded-md border border-white/[.06] bg-white/[.025] px-2 py-1 font-mono text-[9px] text-slate-600">deploy/{item.deploymentId}</span>}<span className="rounded-md border border-white/[.06] bg-white/[.025] px-2 py-1 text-[9px] text-slate-600">{item.confidence}% confidence</span></div>
                    </article>
                  </li>
                ))}
              </ol>
            </section>

            <aside className="space-y-6 lg:sticky lg:top-6">
              <section className="panel-glow overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d1117]/90">
                <div className="border-b border-white/[.065] px-5 py-5"><div className="flex items-center gap-2"><SparklesIcon className="h-4 w-4 text-emerald-300" /><h2 className="text-sm font-semibold">Ranked hypotheses</h2></div><p className="mt-1.5 text-[11px] text-slate-500">Deterministic, evidence-backed scoring</p></div>
                <div className="divide-y divide-white/[.055]">{rankedHypotheses.map((item, index) => (
                  <article key={item.id} className="p-5">
                    <div className="flex items-start gap-4"><div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: `radial-gradient(circle at center, #0d1117 61%, transparent 63%), conic-gradient(#6ee7b7 ${item.score}%, rgba(255,255,255,.07) 0)` }}>{item.score}<span className="text-[8px] text-slate-500">%</span></div><div className="min-w-0"><div className="flex items-center gap-2"><span className="text-[9px] font-semibold text-slate-600">0{index + 1}</span><h3 className="text-xs font-medium text-slate-200">{item.title || formatType(item.hypothesisType)}</h3></div><p className="mt-2 line-clamp-3 text-[10px] leading-4 text-slate-500">{item.explanation}</p></div></div>
                    <div className="mt-4 flex items-center gap-3 text-[9px]"><span className="flex items-center gap-1 text-emerald-300/70"><CheckIcon className="h-3 w-3" />{item.supportingEvidenceIds?.length ?? 0} supporting</span><span className="flex items-center gap-1 text-amber-200/60"><AlertIcon className="h-3 w-3" />{item.counterEvidenceIds?.length ?? 0} counter</span></div>
                  </article>
                ))}{rankedHypotheses.length === 0 && <p className="p-5 text-xs text-slate-500">No hypotheses have been ranked yet.</p>}</div>
              </section>

              <section className="panel-glow rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[.07] to-transparent p-5">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-medium text-emerald-200"><ShieldIcon className="h-4 w-4" />Suggested response</div><span className="rounded-md border border-violet-300/15 bg-violet-300/[.07] px-2 py-1 text-[8px] font-bold tracking-[.1em] text-violet-200">APPROVAL GATED</span></div>
                <p className="mt-4 text-xs leading-5 text-slate-400">{recommendationFor(topHypothesis)}</p>
                <button disabled className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/[.08] bg-white/[.045] px-4 py-2.5 text-[10px] font-semibold text-slate-500"><GitBranchIcon className="h-3.5 w-3.5" />Protected remediation <ArrowUpIcon className="h-3.5 w-3.5" /></button>
              </section>
            </aside>
          </div>

          <footer className="mt-10 flex flex-col gap-3 border-t border-white/[.055] pt-6 text-[10px] text-slate-700 sm:flex-row sm:items-center sm:justify-between"><p>Incident {incident.id}</p><div className="flex items-center gap-2"><ShieldIcon className="h-3 w-3" />Read-only public investigation</div></footer>
        </>}
      </div>
    </main>
  );
}
