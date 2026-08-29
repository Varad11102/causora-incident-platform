"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://13-207-12-164.sslip.io";

export default function LiveIncidentDetail() {
  const [incident, setIncident] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setError("Missing incident ID"); return; }
    Promise.all([
      fetch(`${apiBase}/api/v1/incidents/${id}`).then((r) => r.ok ? r.json() : Promise.reject(new Error(`Incident API returned ${r.status}`))),
      fetch(`${apiBase}/api/v1/incidents/${id}/evidence`).then((r) => r.ok ? r.json() : []),
      fetch(`${apiBase}/api/v1/incidents/${id}/hypotheses`).then((r) => r.ok ? r.json() : []),
    ]).then(([item, evidenceItems, hypothesisItems]) => {
      setIncident(item); setEvidence(evidenceItems); setHypotheses(hypothesisItems);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load incident"));
  }, []);

  return <main className="min-h-screen bg-[#070b16] px-6 py-10 text-slate-100"><div className="mx-auto max-w-6xl">
    <Link href="/" className="text-sm text-cyan-400">← Back to incidents</Link>
    {error && <p className="mt-8 rounded-xl border border-rose-400/30 bg-rose-400/10 p-5 text-rose-200">{error}</p>}
    {!error && !incident && <p className="mt-8 text-slate-400">Loading incident investigation…</p>}
    {incident && <>
      <header className="mt-6 border-b border-slate-800 pb-8"><p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Incident · {incident.id}</p><h1 className="mt-3 text-4xl font-semibold">{incident.title}</h1><p className="mt-4 text-slate-400">{incident.summary}</p><p className="mt-3 text-sm text-slate-500">{incident.sourceService} / {incident.sourceNode} · {new Date(incident.createdAt).toLocaleString()}</p></header>
      <section className="mt-8"><h2 className="text-2xl font-medium">Ranked hypotheses</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{hypotheses.map((item, index) => <article key={item.id ?? index} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"><h3 className="font-medium text-cyan-100">{item.title ?? item.hypothesisType}</h3><p className="mt-3 text-sm text-slate-400">{item.explanation}</p><p className="mt-3 text-2xl text-cyan-300">{item.score}%</p></article>)}</div></section>
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6"><h2 className="text-2xl font-medium">Evidence ({evidence.length})</h2><div className="mt-5 space-y-3">{evidence.map((item, index) => <article key={item.id ?? index} className="rounded-xl border border-slate-800 p-4"><p className="text-xs uppercase text-cyan-400">{item.evidenceType ?? item.type}</p><p className="mt-2 text-sm text-slate-300">{item.summary ?? item.description}</p></article>)}</div></section>
    </>}
  </div></main>;
}
