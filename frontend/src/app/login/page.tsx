"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CausalField from "../../components/causal-field";
import { ArrowIcon, CheckIcon, LogoMark, ShieldIcon } from "../../components/icons";
import { apiFetch, csrfFetch, readApiError } from "../../lib/auth";

type Mode = "login" | "register";

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
        if (!registration.ok) { setError(await readApiError(registration, "We could not create your account.")); return; }
      }

      const login = await csrfFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!login.ok) { setError(await readApiError(login, "The email or password is incorrect.")); return; }
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Causora is temporarily unavailable.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-grid">
      <section className="login-story">
        <header className="relative z-10 flex items-center justify-between border-b border-black/30 pb-4">
          <span className="wordmark"><span className="wordmark__mark"><LogoMark className="h-[18px] w-[18px]" /></span><span>causora <sup className="wordmark__index !text-black">OPS/01</sup></span></span>
          <span className="font-mono text-[8px] font-bold uppercase tracking-[.11em]">Incident intelligence / live</span>
        </header>

        <div className="relative z-10 my-20">
          <span className="eyebrow">A credible cause, not another alert</span>
          <h1 className="login-story__headline display-type mt-10">Incidents<br />have a plot.</h1>
          <p className="mt-10 max-w-md border-l border-black pl-4 text-[12px] leading-6 text-black/65">Causora reconstructs it from live telemetry, durable evidence, and ranked hypotheses.</p>
        </div>

        <div className="login-story__bottom">
          <div className="grid grid-cols-3 border-y border-black/35">
            {[['01', 'Signals', 'Persisted'], ['02', 'Causes', 'Explainable'], ['03', 'Action', 'Approval gated']].map(([index, title, detail]) => (
              <div key={index} className="border-r border-black/35 py-4 pr-3 last:border-r-0 last:pl-3 [&:nth-child(2)]:pl-3"><p className="font-mono text-[8px]">{index}</p><h2 className="mt-5 text-[11px] font-bold">{title}</h2><p className="mt-1 text-[9px] text-black/55">{detail}</p></div>
            ))}
          </div>
          <CausalField compact active={1} critical={1} evidence={5} className="hidden lg:block" />
        </div>
      </section>

      <section className="login-form-side">
        <div className="login-card">
          <div className="flex items-center justify-between border-b border-black pb-4"><span className="eyebrow">Secure access</span><span className="live-key"><i /> API online</span></div>

          <div className="mt-12">
            <p className="font-mono text-[9px] uppercase tracking-[.12em] text-black/45">Workspace authentication</p>
            <h2 className="display-type mt-3 text-5xl leading-none">{mode === "login" ? "Welcome back." : "Enter the field."}</h2>
            <p className="mt-4 max-w-sm text-[11px] leading-5 text-black/55">{mode === "login" ? "Open your authenticated incident workspace." : "Create a protected viewer account for the live system."}</p>
          </div>

          <div className="login-tabs mt-10" role="tablist" aria-label="Authentication mode">
            {(["login", "register"] as Mode[]).map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => { setMode(item); setError(""); }}>{item === "login" ? "01 / Sign in" : "02 / Create account"}</button>)}
          </div>

          <form onSubmit={submit} className="mt-7 space-y-6">
            {mode === "register" && <label className="block"><span className="eyebrow !text-[8px] before:!hidden">Display name</span><input required minLength={2} maxLength={80} autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Varad Operator" className="auth-input" /></label>}
            <label className="block"><span className="eyebrow !text-[8px] before:!hidden">Email address</span><input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="auth-input" /></label>
            <label className="block"><span className="flex items-center justify-between"><span className="eyebrow !text-[8px] before:!hidden">Password</span>{mode === "register" && <span className="font-mono text-[8px] text-black/40">12+ characters</span>}</span><input required type="password" minLength={mode === "register" ? 12 : undefined} maxLength={64} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" className="auth-input" /></label>

            {error && <div role="alert" className="border border-black bg-[#ff5c35] px-4 py-3 text-[11px] leading-5">{error}</div>}

            <button disabled={submitting} className="button-solid mt-3 !h-12 w-full !justify-between !px-4">
              <span>{submitting ? "Securing session…" : mode === "login" ? "Open workspace" : "Create account"}</span>
              {submitting ? <span className="h-4 w-4 animate-spin rounded-full border border-white/30 border-t-white" /> : mode === "login" ? <ArrowIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-8 flex items-start gap-3 border-t border-black/20 pt-4 text-[9px] leading-4 text-black/45"><ShieldIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Server-side session / CSRF protected / BCrypt credentials / secure cookie</span></div>
        </div>
      </section>
    </main>
  );
}
