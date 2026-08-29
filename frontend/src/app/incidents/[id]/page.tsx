import Link from "next/link";
import { getIncident, incidents } from "../../incidents";

export function generateStaticParams() {
  return incidents.map(({ id }) => ({ id }));
}

export default function IncidentDetail({ params }: { params: { id: string } }) {
  const incident = getIncident(params.id);
  const hypotheses = [
    { title: incident.cause, score: incident.confidence, explanation: `The strongest correlated signals point to ${incident.cause.toLowerCase()} in ${incident.service}.`, supporting: 4, counter: 0 },
    { title: "Transient infrastructure degradation", score: Math.max(38, incident.confidence - 27), explanation: "Health and latency signals support an infrastructure issue, but the timing is less conclusive.", supporting: 2, counter: 1 },
  ];
  const timeline = [
    ["10:31:17", "CHANGE_EVENT", `${incident.service} configuration or runtime state changed`],
    ["10:32:00", "HEALTH_FAILURE", `${incident.title} detected`],
    ["10:32:12", "ERROR_EVENT", `Error threshold exceeded on ${incident.sourceNode}`],
    ["10:33:05", "INVESTIGATION", `${incident.confidence}% causal confidence established from correlated evidence`],
  ];

  return (
    <main className="min-h-screen bg-[#070b16] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">← Back to incidents</Link>
        <div className="mt-6 flex flex-col gap-5 border-b border-slate-800 pb-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Incident · {params.id}</p>
            <h1 className="mt-3 text-4xl font-semibold">{incident.title}</h1>
            <p className="mt-4 max-w-3xl text-slate-400">{incident.summary}</p>
            <p className="mt-3 text-sm text-slate-500">{incident.service} / {incident.sourceNode} · {new Date(incident.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-sm text-rose-200">{incident.severity}</span>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">{incident.status}</span>
          </div>
        </div>
        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div><h2 className="text-2xl font-medium">Ranked hypotheses</h2><p className="mt-1 text-sm text-slate-500">Explainable scoring from correlated evidence</p></div>
            <span className="text-sm text-emerald-300">{incident.confidence >= 80 ? "High" : "Moderate"} confidence</span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {hypotheses.map((hypothesis) => (
              <article key={hypothesis.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex items-start justify-between gap-4"><h3 className="font-medium text-cyan-100">{hypothesis.title}</h3><span className="text-3xl font-semibold text-cyan-300">{hypothesis.score}</span></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${hypothesis.score}%` }} /></div>
                <p className="mt-4 text-sm leading-6 text-slate-400">{hypothesis.explanation}</p>
                <p className="mt-3 text-xs text-slate-500">{hypothesis.supporting} supporting · {hypothesis.counter} counter-evidence</p>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-medium">Evidence timeline</h2>
          <ol className="mt-6 border-l border-slate-700 pl-7">
            {timeline.map(([time, type, summary]) => (
              <li key={time} className="relative pb-7 last:pb-0">
                <span className="absolute -left-[2.05rem] top-1 h-3 w-3 rounded-full bg-cyan-400 ring-4 ring-cyan-400/10" />
                <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-medium text-cyan-400">{time}</span><span className="text-xs uppercase tracking-wider text-slate-500">{type}</span></div>
                <p className="mt-2 text-slate-300">{summary}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 md:flex-row md:items-center">
          <div><p className="font-medium text-emerald-200">Suggested remediation</p><p className="mt-1 text-sm text-slate-400">{incident.remediation}</p></div>
          <button className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950">Review proposal</button>
        </section>
      </div>
    </main>
  );
}
