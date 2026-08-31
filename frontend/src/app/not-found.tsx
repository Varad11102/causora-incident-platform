import Link from "next/link";
import { ArrowIcon, LogoMark } from "../components/icons";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#ff5c35] px-5">
      <section className="w-full max-w-3xl border border-black bg-[#f1efe8] p-7 sm:p-12">
        <div className="flex items-center justify-between border-b border-black pb-4"><span className="wordmark"><span className="wordmark__mark"><LogoMark className="h-[18px] w-[18px]" /></span>causora</span><span className="font-mono text-[9px] font-bold">ERR / 404</span></div>
        <p className="eyebrow mt-14">Signal not found</p>
        <h1 className="display-type mt-7 text-6xl leading-[.85] sm:text-8xl">This path left<br />the topology.</h1>
        <div className="mt-14 flex flex-col gap-5 border-t border-black pt-5 sm:flex-row sm:items-end sm:justify-between"><p className="max-w-sm text-[12px] leading-6 text-black/55">The page may have moved, or the incident link is no longer valid.</p><Link href="/" className="button-solid">Return to incident index <ArrowIcon className="h-4 w-4" /></Link></div>
      </section>
    </main>
  );
}
