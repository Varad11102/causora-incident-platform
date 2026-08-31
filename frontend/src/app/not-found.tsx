import Link from "next/link";
import { ArrowIcon, LogoMark } from "../components/icons";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 text-slate-100">
      <div className="app-grid pointer-events-none absolute inset-0" />
      <div className="aurora-field pointer-events-none absolute inset-0" />
      <section className="glass-panel panel-glow relative max-w-xl rounded-[2rem] border border-white/[.08] bg-[#0d1117]/90 p-10 text-center sm:p-14">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[.08] text-emerald-300">
          <LogoMark className="h-6 w-6" />
        </span>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[.22em] text-emerald-300/70">Signal not found / 404</p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-.045em] text-white">This path left the topology.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">The page may have moved, or the incident link is no longer valid.</p>
        <Link href="/" className="premium-button premium-button-primary mt-8">Return to incident stream <ArrowIcon className="h-4 w-4" /></Link>
      </section>
    </main>
  );
}
