type Incident = {
  id: string;
  status: string;
  severity: string;
  title: string;
  summary: string;
  sourceService: string;
  sourceNode: string;
  createdAt: string;
};

type Evidence = {
  id: string;
  observedAt: string;
  evidenceType: string;
  sourceService: string;
  sourceNode: string;
  value: string;
};

type TimelineEntry = {
  id: string;
  timestamp: string;
  eventType: string;
  service: string;
  node: string;
  summary: string;
};

type Hypothesis = {
  id: string;
  hypothesisType: string;
  title: string;
  score: number;
  explanation: string;
  supportingEvidenceIds: string[];
  counterEvidenceIds: string[];
};

const apiBase = process.env.CAUSORA_API_BASE_URL ?? "http://127.0.0.1:8082";

async function load<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Causora API returned ${response.status}`);
  return response.json() as Promise<T>;
}

export default async function IncidentDetail({ params }: { params: { id: string } }) {
  const base = `/api/v1/incidents/${params.id}`;
  const [incident, evidence, timeline, hypotheses] = await Promise.all([
    load<Incident>(base),
    load<Evidence[]>(`${base}/evidence`),
    load<TimelineEntry[]>(`${base}/timeline`),
    load<Hypothesis[]>(`${base}/hypotheses`),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Incident investigation</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-semibold">{incident.title}</h1>
        <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-sm text-rose-200">
          {incident.status} · {incident.severity}
        </span>
      </div>
      <p className="mt-4 max-w-3xl text-slate-300">{incident.summary}</p>
      <p className="mt-2 text-sm text-slate-500">
        {incident.sourceService} / {incident.sourceNode} · {new Date(incident.createdAt).toLocaleString()}
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-medium">Ranked hypotheses</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {hypotheses.map((hypothesis) => (
            <article key={hypothesis.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-medium text-cyan-100">{hypothesis.title}</h3>
                <span className="text-2xl font-semibold text-cyan-300">{hypothesis.score}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{hypothesis.explanation}</p>
              <p className="mt-3 text-xs text-slate-500">
                {hypothesis.supportingEvidenceIds.length} supporting · {hypothesis.counterEvidenceIds.length} counter
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-medium">Evidence timeline</h2>
        <ol className="mt-4 border-l border-slate-700 pl-6">
          {timeline.map((entry) => (
            <li key={entry.id} className="relative pb-6">
              <span className="absolute -left-[1.76rem] top-1 h-3 w-3 rounded-full bg-cyan-400" />
              <p className="text-xs uppercase tracking-wider text-cyan-400">{entry.eventType}</p>
              <p className="mt-1 text-slate-200">{entry.summary}</p>
              <p className="mt-1 text-xs text-slate-500">
                {entry.service} / {entry.node} · {new Date(entry.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-medium">Structured evidence</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-700">
          {evidence.map((item) => (
            <div key={item.id} className="border-b border-slate-800 bg-slate-900/40 p-4 last:border-b-0">
              <p className="text-sm font-medium text-cyan-200">{item.evidenceType}</p>
              <p className="mt-1 text-slate-300">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
