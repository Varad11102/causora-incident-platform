import Link from "next/link";

const incidents = [
  { id: "demo-001", title: "Payment API database connectivity failure", service: "payment-service", severity: "CRITICAL", status: "INVESTIGATING", started: "8 minutes ago", confidence: 92 },
  { id: "demo-002", title: "Checkout latency above SLO", service: "checkout-service", severity: "WARNING", status: "OPEN", started: "24 minutes ago", confidence: 76 },
  { id: "demo-003", title: "Kafka consumer lag recovered", service: "notification-service", severity: "INFO", status: "RESOLVED", started: "2 hours ago", confidence: 88 },
];

const severityStyle: Record<string, string> = {
  CRITICAL: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  WARNING: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  INFO: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
};

const services = [
  ["Frontend", "Next.js", "UP", "18 ms"],
  ["Telemetry API", ":8081", "UP", "32 ms"],
  ["Incident API", ":8082", "UP", "41 ms"],
  ["Remediation API", ":8084", "UP", "38 ms"],
  ["Kafka", "telemetry.operational.v1", "UP", "6 ms"],
  ["PostgreSQL", "causora_incidents", "UP", "12 ms"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070b16] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400">Causora</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Incident command center</h1>
            <p className="mt-2 text-slate-400">Causal investigation and approval-controlled remediation</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Demo environment healthy
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Active incidents", "2", "1 critical"],
            ["Mean time to detect", "42s", "Down 18% this week"],
            ["Evidence collected", "148", "Across 12 services"],
            ["Auto-remediation", "Off", "Approval required"],
          ].map(([label, value, note]) => (
            <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/10">
              <p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div><h2 className="text-xl font-medium">Recent incidents</h2><p className="mt-1 text-sm text-slate-500">Sample operational data for frontend evaluation</p></div>
            <span className="rounded-lg bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">LIVE DEMO</span>
          </div>
          <div className="divide-y divide-slate-800">
            {incidents.map((incident) => (
              <Link key={incident.id} href={`/incidents/${incident.id}`} className="grid gap-4 px-6 py-5 transition hover:bg-slate-800/40 md:grid-cols-[1fr_160px_130px_100px] md:items-center">
                <div><p className="font-medium text-slate-100">{incident.title}</p><p className="mt-1 text-sm text-slate-500">{incident.service} · {incident.started}</p></div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs ${severityStyle[incident.severity]}`}>{incident.severity}</span>
                <span className="text-sm text-slate-300">{incident.status}</span><span className="text-right text-sm font-medium text-cyan-300">{incident.confidence}% cause</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div><h2 className="text-xl font-medium">Platform health</h2><p className="mt-1 text-sm text-slate-500">Sample service availability and response latency</p></div>
            <p className="text-xs text-slate-500">Last checked just now</p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {services.map(([name, detail, status, latency]) => (
              <article key={name} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
                  <div><p className="text-sm font-medium">{name}</p><p className="mt-0.5 text-xs text-slate-500">{detail}</p></div>
                </div>
                <div className="text-right"><p className="text-xs font-semibold text-emerald-300">{status}</p><p className="mt-0.5 text-xs text-slate-500">{latency}</p></div>
              </article>
            ))}
          </div>
        </section>
        <p className="mt-5 text-center text-xs text-slate-600">Demo data only · Connect the Causora services for live telemetry</p>
      </div>
    </main>
  );
}
