"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-[#161713] px-5">
          <section className="w-full max-w-xl border border-white/25 bg-[#f1efe8] p-8 text-[#161713] sm:p-12">
            <p className="eyebrow">Workspace interrupted / ERR 500</p>
            <h1 className="display-type mt-10 text-6xl leading-[.86]">The signal stream broke.</h1>
            <p className="mt-8 border-l-4 border-[#ff5c35] pl-4 text-[12px] leading-6 text-black/55">Your data is safe. Reconnect the workspace to try the request again.</p>
            <button type="button" onClick={reset} className="button-solid mt-9 w-full">Reconnect workspace</button>
          </section>
        </main>
      </body>
    </html>
  );
}
