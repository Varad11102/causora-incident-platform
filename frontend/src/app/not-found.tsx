"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const incidentsIndex = parts.lastIndexOf("incidents");
    const incidentId = incidentsIndex >= 0 ? parts[incidentsIndex + 1] : undefined;

    if (!incidentId) return;

    const basePath = `/${parts.slice(0, incidentsIndex).join("/")}`;
    setRedirecting(true);
    window.location.replace(`${basePath}/incident/?id=${encodeURIComponent(incidentId)}`);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b16] px-6 text-slate-100">
      <section className="max-w-lg rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400">Causora</p>
        <h1 className="mt-4 text-3xl font-semibold">{redirecting ? "Opening incident" : "Page not found"}</h1>
        <p className="mt-3 text-slate-400">
          {redirecting ? "Redirecting this legacy incident link to the live investigation." : "The requested page does not exist."}
        </p>
        {!redirecting && <Link href="/" className="mt-6 inline-block text-sm font-medium text-cyan-300 hover:text-cyan-200">Back to incidents</Link>}
      </section>
    </main>
  );
}
