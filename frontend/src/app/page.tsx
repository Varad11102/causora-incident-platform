"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Incident = {
  id: string; title: string; sourceService: string; severity: string;
  status: string; createdAt: string; summary: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://13-207-12-164.sslip.io";

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
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/v1/incidents`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`API returned ${response.status}`)))
      .then(setIncidents)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to reach the incident API"));
  }, []);

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
            ["Active incidents", String(incidents.filter((incident) => incident.status !== "RESOLVED").length), `${incidents.filter((incident) => incident.severity === "CRITICAL" && incident.status !== "RESOLVED").length} critical`],
            ["Mean time to detect", "42s", "Down 18% this week"],
            ["Persisted incidents", String(incidents.length), "PostgreSQL-backed"],
            ["Auto-remediation", "Off", "Approval required"],
          ].map(([label, value, note]) => (
            <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/10">
              <p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div><h2 className="text-xl font-medium">Recent incidents</h2><p className="mt-1 text-sm text-slate-500">Live operational data from the Causora API</p></div>
            <span className="rounded-lg bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">LIVE API</span>
          </div>
          {error && <p className="border-b border-rose-400/20 bg-rose-400/10 px-6 py-4 text-sm text-rose-200">API unavailable: {error}</p>}
          {!error && incidents.length === 0 && <p className="px-6 py-8 text-sm text-slate-400">Loading persisted incidents…</p>}
          <div className="divide-y divide-slate-800">
            {incidents.map((incident) => (
              <Link key={incident.id} href={`/incident?id=${incident.id}`} className="grid gap-4 px-6 py-5 transition hover:bg-slate-800/40 md:grid-cols-[1fr_160px_130px_100px] md:items-center">
                <div><p className="font-medium text-slate-100">{incident.title}</p><p className="mt-1 text-sm text-slate-500">{incident.sourceService} · {new Date(incident.createdAt).toLocaleString()}</p></div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs ${severityStyle[incident.severity]}`}>{incident.severity}</span>
                <span className="text-sm text-slate-300">{incident.status}</span><span className="text-right text-sm font-medium text-cyan-300">View evidence</span>
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
