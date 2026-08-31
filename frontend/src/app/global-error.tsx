"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#080b0f] px-5 text-slate-100">
          <div className="app-grid pointer-events-none absolute inset-0" />
          <section className="panel-glow relative max-w-lg rounded-[2rem] border border-white/[.08] bg-[#0d1117] p-10 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-red-300/80">Workspace interrupted</p>
            <h1 className="mt-4 text-3xl font-medium tracking-[-.035em] text-white">The signal stream hit an error.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-500">Your data is safe. Reconnect the workspace to try the request again.</p>
            <button type="button" onClick={reset} className="premium-button premium-button-primary mt-8">Reconnect workspace</button>
          </section>
        </main>
      </body>
    </html>
  );
}
