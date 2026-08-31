"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowIcon, ChevronLeftIcon, CopyIcon, LogoMark, ShieldIcon } from "../../components/icons";
import { apiFetch } from "../../lib/auth";

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
}

function formatType(value: string) {
  return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function duration(start: string, end: string) {
  const seconds = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function recommendationFor(hypothesis?: Hypothesis) {
  if (!hypothesis) return "Review the correlated evidence and validate the affected service before approving an action.";
  if (hypothesis.hypothesisType.includes("DEPLOYMENT")) return "Roll back the correlated deployment, restore the last known-good configuration, and verify service recovery.";
  if (hypothesis.hypothesisType.includes("DATABASE")) return "Restore database connectivity, validate credentials and network policy, then replay a health check.";
  if (hypothesis.hypothesisType.includes("KAFKA")) return "Inspect consumer lag and partition health, then restart only the affected consumer group if required.";
  return "Validate the highest-ranked cause against supporting evidence before initiating the protected remediation workflow.";
}

function DetailSkeleton() {
  return <div className="mt-10 space-y-5"><div className="skeleton h-3 w-32" /><div className="skeleton h-28 max-w-4xl" /><div className="stats-band">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-28 border-r border-black/10" />)}</div><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"><div className="skeleton h-[480px]" /><div className="skeleton h-[420px]" /></div></div>;
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
      apiFetch(`/api/v1/incidents/${id}`, { cache: "no-store" }),
      apiFetch(`/api/v1/incidents/${id}/evidence`, { cache: "no-store" }),
      apiFetch(`/api/v1/incidents/${id}/hypotheses`, { cache: "no-store" }),
    ]).then(async ([incidentResponse, evidenceResponse, hypothesisResponse]) => {
      if ([incidentResponse, evidenceResponse, hypothesisResponse].some((response) => response.status === 401)) { window.location.replace("/login"); return; }
      if (!incidentResponse.ok) throw new Error(`Incident API returned ${incidentResponse.status}`);
      setIncident(await incidentResponse.json());
      setEvidence(evidenceResponse.ok ? await evidenceResponse.json() : []);
      setHypotheses(hypothesisResponse.ok ? await hypothesisResponse.json() : []);
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
    <main className="min-h-screen">
      <div className="editorial-shell pb-16">
        <nav className="topbar">
          <div className="flex items-center gap-5">
            <Link href="/" className="wordmark" aria-label="Causora home"><span className="wordmark__mark"><LogoMark className="h-[18px] w-[18px]" /></span><span>causora <sup className="wordmark__index">CASE/07</sup></span></Link>
            <span className="hidden h-6 w-px bg-black/20 sm:block" /><span className="hidden font-mono text-[8px] uppercase tracking-[.08em] text-black/45 sm:block">Investigation record</span>
          </div>
          <span className="live-key"><i /> live evidence</span>
        </nav>

        {error && <section className="mx-auto mt-20 max-w-xl border border-black bg-[#ff5c35] p-8"><span className="eyebrow">Load failure</span><h1 className="display-type mt-10 text-5xl">Investigation unavailable.</h1><p className="mt-4 text-sm text-black/60">{error}</p><Link href="/" className="button-solid mt-7"><ChevronLeftIcon className="h-4 w-4" />Return to incident index</Link></section>}
        {!error && !incident && <DetailSkeleton />}

        {incident && <>
          <div className="flex items-center justify-between py-6"><Link href="/" className="utility-link inline-flex items-center gap-1"><ChevronLeftIcon className="h-4 w-4" />Incident index</Link><button onClick={() => void copyIncidentId()} className="button-line !min-h-0 !border-0 !p-0 font-mono !text-[9px]"><CopyIcon className="h-3.5 w-3.5" />{copied ? "ID copied" : `#${incident.id.slice(0, 8).toUpperCase()}`}</button></div>

          <header className="detail-kicker border-x border-b border-black">
            <div className="grid lg:grid-cols-[150px_minmax(0,1fr)]">
              <div className="flex flex-row justify-between border-b border-black p-5 lg:min-h-[340px] lg:flex-col lg:border-b-0 lg:border-r">
                <div><p className="font-mono text-[8px] uppercase tracking-[.1em] text-black/45">Severity</p><p className={`mt-3 w-fit px-2 py-1 font-mono text-[9px] font-bold ${incident.severity === "CRITICAL" ? "bg-[#d93b2b] text-white" : "border border-black"}`}>{incident.severity}</p></div>
                <div className="text-right lg:text-left"><p className="display-type text-6xl leading-none text-[#ff5c35]">07</p><p className="mt-2 font-mono text-[8px] uppercase tracking-[.08em] text-black/45">case record</p></div>
              </div>
              <div className="flex min-h-[340px] flex-col justify-between p-6 sm:p-9 lg:p-12">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[8px] uppercase tracking-[.09em] text-black/50"><span>{incident.status}</span><span>Opened / {formatDate(incident.createdAt)}</span><span>{incident.sourceService}</span></div>
                <div className="my-16 lg:my-8"><h1 className="display-type max-w-5xl text-[48px] leading-[.9] sm:text-[64px] lg:text-[78px]">{incident.title}</h1><p className="mt-7 max-w-3xl border-l-4 border-[#ff5c35] pl-4 text-[13px] leading-6 text-black/60">{incident.summary}</p></div>
                <p className="font-mono text-[8px] uppercase tracking-[.08em] text-black/40">Trigger / {incident.triggeringEventId}</p>
              </div>
            </div>

            <div className="grid border-t border-black sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Affected service", incident.sourceService],
                ["Source node", incident.sourceNode],
                ["Evidence window", duration(incident.createdAt, incident.updatedAt)],
                ["Top confidence", topHypothesis ? `${topHypothesis.score}%` : "Pending"],
              ].map(([label, value]) => <div className="detail-metric" key={label}><p>{label}</p><p className="truncate">{value}</p></div>)}
            </div>
          </header>

          <div className="mt-14 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
            <section>
              <div className="section-rule"><h2>Evidence chronology</h2><p>{String(timeline.length).padStart(2, "0")} correlated records</p></div>
              <ol className="mt-3 border-t border-black">
                {timeline.map((item, index) => <li key={item.id} className="timeline-item">
                  <span className="timeline-item__index">{String(index + 1).padStart(2, "0")}</span>
                  <article className="timeline-item__body">
                    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="timeline-item__title">{formatType(item.evidenceType)}</h3><time className="font-mono text-[8px] text-black/40">{formatDate(item.observedAt)}</time></div>
                    <p className="timeline-item__copy">{item.value}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5"><span className="metadata-chip">{item.sourceService}</span>{item.deploymentId && <span className="metadata-chip max-w-[240px] truncate">deploy/{item.deploymentId}</span>}<span className="metadata-chip">{item.confidence}% confidence</span></div>
                  </article>
                </li>)}
              </ol>
            </section>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <section className="ink-panel p-5 sm:p-6">
                <div className="flex items-start justify-between border-b border-white/20 pb-4"><div><span className="eyebrow eyebrow--inverse">Cause ranking</span><p className="mt-3 text-[10px] text-white/35">Deterministic / evidence backed</p></div><span className="font-mono text-[8px] text-[#d9ff43]">{String(rankedHypotheses.length).padStart(2, "0")} FOUND</span></div>
                <div>{rankedHypotheses.map((item, index) => <article key={item.id} className="hypothesis-row">
                  <div className="grid grid-cols-[62px_minmax(0,1fr)] gap-4"><div><p className="hypothesis-row__score">{item.score}</p><p className="font-mono text-[7px] text-white/30">PERCENT</p></div><div><p className="font-mono text-[8px] text-white/30">RANK / {String(index + 1).padStart(2, "0")}</p><h3 className="mt-2 text-[11px] font-bold leading-4">{item.title || formatType(item.hypothesisType)}</h3></div></div>
                  <div className="score-track"><i style={{ width: `${item.score}%` }} /></div>
                  <p className="mt-3 text-[9px] leading-4 text-white/42">{item.explanation}</p>
                  <p className="mt-3 font-mono text-[7px] uppercase tracking-[.07em] text-white/30">{item.supportingEvidenceIds?.length ?? 0} supporting / {item.counterEvidenceIds?.length ?? 0} counter</p>
                </article>)}{rankedHypotheses.length === 0 && <p className="py-6 text-[10px] text-white/40">No hypotheses have been ranked yet.</p>}</div>
              </section>

              <section className="safety-note p-5 sm:p-6">
                <div className="flex items-center justify-between"><span className="eyebrow">Suggested response</span><span className="font-mono text-[7px] font-bold uppercase tracking-[.08em]">Approval gated</span></div>
                <p className="mt-10 text-[12px] font-semibold leading-6">{recommendationFor(topHypothesis)}</p>
                <button disabled className="mt-7 flex w-full cursor-not-allowed items-center justify-between border-t border-black pt-4 text-[10px] font-bold opacity-55"><span className="flex items-center gap-2"><ShieldIcon className="h-4 w-4" />Protected remediation</span><ArrowIcon className="h-4 w-4" /></button>
              </section>
            </aside>
          </div>

          <footer className="mt-16 flex flex-col gap-3 border-t border-black py-5 font-mono text-[8px] uppercase tracking-[.08em] text-black/45 sm:flex-row sm:justify-between"><p>Incident / {incident.id}</p><p>Authenticated investigation record</p></footer>
        </>}
      </div>
    </main>
  );
}
