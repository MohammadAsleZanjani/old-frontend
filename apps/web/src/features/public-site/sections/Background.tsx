"use client";

export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ ["--mx" as string]: "50%", ["--my" as string]: "30%" }}
    >
      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-70" />
      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: "var(--vignette)" }} />

      {/* Mouse glow */}
      <div className="absolute inset-0 transition-[background] duration-300" style={{
        background: "radial-gradient(40rem 40rem at var(--mx) var(--my), oklch(0.82 0.16 84 / 0.10), transparent 60%)"
      }} />
      {/* Ambient orbs */}
      <div className="absolute -top-40 right-[10%] h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, oklch(0.82 0.18 84 / 0.18), transparent 70%)" }} />
      <div className="absolute bottom-[-20%] left-[-10%] h-[40rem] w-[40rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, oklch(0.42 0.14 330 / 0.20), transparent 70%)" }} />
      <div className="absolute top-[40%] left-[40%] h-[24rem] w-[24rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, oklch(0.62 0.14 200 / 0.10), transparent 70%)" }} />
    </div>
  );
}
