"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityIcon, CheckIcon, DatabaseIcon, GitBranchIcon, LogoMark, ShieldIcon, SparklesIcon } from "../../components/icons";
import { apiFetch, csrfFetch, readApiError } from "../../lib/auth";

type Mode = "login" | "register";

const benefits = [
  { icon: ActivityIcon, title: "Live incident stream", detail: "Follow persisted signals as they move through the platform." },
  { icon: SparklesIcon, title: "Evidence-backed causes", detail: "Inspect ranked hypotheses instead of chasing disconnected alerts." },
  { icon: ShieldIcon, title: "Protected by default", detail: "Server-side sessions, CSRF checks, and role-based access." },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void apiFetch("/api/v1/auth/me", { cache: "no-store" }).then((response) => {
      if (response.ok) router.replace("/");
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (mode === "register") {
        const registration = await csrfFetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName, email, password }),
        });
        if (!registration.ok) {
          setError(await readApiError(registration, "We could not create your account."));
          return;
        }
      }

      const login = await csrfFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!login.ok) {
        setError(await readApiError(login, "The email or password is incorrect."));
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Causora is temporarily unavailable.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="app-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-52 -top-52 h-[36rem] w-[36rem] rounded-full bg-emerald-300/[.08] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-72 -right-56 h-[42rem] w-[42rem] rounded-full bg-sky-400/[.06] blur-[140px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1320px] items-center gap-12 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-10">
        <section className="hidden lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[.08] text-emerald-300 shadow-[0_0_40px_rgba(110,231,183,.1)]"><LogoMark className="h-6 w-6" /></span>
            <span className="text-lg font-semibold tracking-[-.02em]">causora<span className="text-emerald-300">.</span></span>
          </div>
          <p className="mt-14 text-xs font-semibold uppercase tracking-[.2em] text-emerald-300/70">Incident intelligence workspace</p>
          <h1 className="mt-5 max-w-3xl text-6xl font-medium leading-[1.02] tracking-[-.055em] text-white">From noisy telemetry<br /><span className="text-slate-600">to a credible cause.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-400">A live, end-to-end operations platform for investigating failures with durable evidence and explainable rankings.</p>

          <div className="mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => { const Icon = benefit.icon; return (
              <article key={benefit.title} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4 backdrop-blur-sm">
                <Icon className="h-4 w-4 text-emerald-300" />
                <h2 className="mt-4 text-xs font-semibold text-slate-200">{benefit.title}</h2>
                <p className="mt-2 text-[10px] leading-4 text-slate-600">{benefit.detail}</p>
              </article>
            ); })}
          </div>

          <div className="mt-10 flex items-center gap-3 text-[10px] uppercase tracking-[.14em] text-slate-700">
            <DatabaseIcon className="h-3.5 w-3.5" /><span>PostgreSQL</span><span>•</span><GitBranchIcon className="h-3.5 w-3.5" /><span>Kafka</span><span>•</span><span>Spring Security</span>
          </div>
        </section>

        <section className="panel-glow rounded-[28px] border border-white/[.085] bg-[#0d1117]/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/[.08] text-emerald-300"><LogoMark className="h-5 w-5" /></span>
            <span className="font-semibold">causora<span className="text-emerald-300">.</span></span>
          </div>

          <div className="flex rounded-xl border border-white/[.07] bg-black/20 p-1">
            {(["login", "register"] as Mode[]).map((item) => (
              <button key={item} type="button" onClick={() => { setMode(item); setError(""); }} className={`h-9 flex-1 rounded-lg text-xs font-semibold capitalize transition ${mode === item ? "bg-white/[.09] text-white shadow-sm" : "text-slate-600 hover:text-slate-300"}`}>{item === "login" ? "Sign in" : "Create account"}</button>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-300/70">Secure workspace</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-.035em] text-white">{mode === "login" ? "Welcome back." : "Join Causora."}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">{mode === "login" ? "Sign in to open the live incident console." : "Create a viewer account for the live operations workspace."}</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "register" && <label className="block"><span className="mb-2 block text-[11px] font-medium text-slate-400">Display name</span><input required minLength={2} maxLength={80} autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Varad Operator" className="auth-input" /></label>}
            <label className="block"><span className="mb-2 block text-[11px] font-medium text-slate-400">Email address</span><input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="auth-input" /></label>
            <label className="block"><span className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400"><span>Password</span>{mode === "register" && <span className="font-normal text-slate-700">12+ characters</span>}</span><input required type="password" minLength={mode === "register" ? 12 : undefined} maxLength={64} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" className="auth-input" /></label>

            {error && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[.07] px-4 py-3 text-xs leading-5 text-red-200">{error}</div>}

            <button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 text-xs font-bold text-[#07110e] shadow-[0_14px_40px_rgba(110,231,183,.12)] transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-60">
              {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07110e]/25 border-t-[#07110e]" /> : <CheckIcon className="h-4 w-4" />}
              {submitting ? "Securing session…" : mode === "login" ? "Open workspace" : "Create account"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-700"><ShieldIcon className="h-3.5 w-3.5" />Encrypted transport · server-side session · CSRF protected</div>
        </section>
      </div>
    </main>
  );
}
