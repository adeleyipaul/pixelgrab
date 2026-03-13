"use client";

import Link from "next/link";
import { Palette, ArrowRight, SwatchBook, Code2, FileJson, Wind } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col w-full">

      {/* ─── Hero ─── */}
      <section className="relative flex flex-col items-center text-center gap-7 sm:gap-9 pt-12 sm:pt-20 pb-20 sm:pb-28 overflow-hidden">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[480px] bg-emerald-500/[0.07] rounded-full blur-[110px]"
        />

        {/* Glowing badge */}
        <div className="badge-glow relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/50 text-xs font-semibold text-emerald-400 tracking-wide uppercase w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Palette className="w-3.5 h-3.5" />
          Color Palette Extractor
        </div>

        {/* Heading */}
        <h2 className="relative z-10 text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.12] max-w-4xl">
          <span className="animate-shimmer-text whitespace-normal lg:whitespace-nowrap">Pull colors from any image.</span>
          <br />
          <span className="text-zinc-500">Export in seconds.</span>
        </h2>

        {/* Subtext */}
        <p className="relative z-10 text-zinc-400 max-w-lg mx-auto text-base sm:text-lg leading-relaxed">
          Drop an image, get its dominant colors, then export them as CSS variables,
          JSON tokens, or a Tailwind config — ready to drop into your project.
        </p>

        {/* CTA */}
        <Link
          href="/palette"
          className="group relative z-10 inline-flex items-center gap-2.5 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-white/[0.08] active:scale-[0.97] text-sm sm:text-base"
        >
          Open Palette Tool
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>

        {/* Section divider */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800/80 to-transparent"
        />
      </section>

      {/* ─── Features ─── */}
      <section className="pt-14 sm:pt-20 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              icon: <SwatchBook className="w-5 h-5 text-emerald-400" />,
              iconHover: "group-hover:bg-emerald-950/70 group-hover:shadow-[0_0_22px_rgba(52,211,153,0.2)]",
              borderHover: "hover:border-emerald-800/60",
              title: "Dominant Color Extraction",
              desc: "Automatically surfaces the most visually present colors with smart deduplication — no noise, just signal.",
            },
            {
              icon: <Code2 className="w-5 h-5 text-sky-400" />,
              iconHover: "group-hover:bg-sky-950/70 group-hover:shadow-[0_0_22px_rgba(56,189,248,0.2)]",
              borderHover: "hover:border-sky-800/60",
              title: "Multiple Color Formats",
              desc: "Toggle between HEX, RGB, and HSL on the fly. Copy any individual color value with a single click.",
            },
            {
              icon: <FileJson className="w-5 h-5 text-violet-400" />,
              iconHover: "group-hover:bg-violet-950/70 group-hover:shadow-[0_0_22px_rgba(167,139,250,0.2)]",
              borderHover: "hover:border-violet-800/60",
              title: "Developer-Ready Exports",
              desc: "Export as CSS variables, a JSON token file, or a Tailwind theme extension. Copy or download in one click.",
            },
          ].map(({ icon, iconHover, borderHover, title, desc }, i) => (
            <FadeUp key={title} delay={i * 90} className="h-full">
              <div
                className={`group flex flex-col gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all duration-300 h-full ${borderHover}`}
              >
                <div className={`p-2.5 bg-zinc-800 rounded-xl w-fit transition-all duration-300 ${iconHover}`}>
                  {icon}
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="pb-20 sm:pb-28">
        <FadeUp className="mb-8">
          <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-600 text-center">
            How it works
          </h3>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              step: "01",
              title: "Upload your image",
              desc: "Drag and drop or click to select any PNG, JPG, GIF, or WebP up to 10 MB.",
            },
            {
              step: "02",
              title: "Get your palette",
              desc: "PixelGrab extracts the dominant, distinct colors and displays them instantly.",
            },
            {
              step: "03",
              title: "Copy or export",
              desc: "Copy individual values, grab everything at once, or download a CSS, JSON, or Tailwind file.",
            },
          ].map(({ step, title, desc }, i) => (
            <FadeUp key={step} delay={i * 90}>
              <div className="relative flex flex-col gap-3 p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 hover:border-zinc-700/60 hover:bg-zinc-900/40 transition-all duration-300 overflow-hidden">
                <span
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute -bottom-2 -right-1 text-[5.5rem] font-black text-zinc-800/60 leading-none"
                >
                  {step}
                </span>
                <span className="text-[10px] font-bold text-zinc-600 font-mono tracking-widest relative z-10">
                  STEP {step}
                </span>
                <h4 className="text-sm font-semibold text-zinc-200 relative z-10">{title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed relative z-10">{desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <FadeUp>
        <section className="flex flex-col items-center gap-4 pb-16 sm:pb-24 text-center">
          <p className="text-zinc-500 text-sm">For designers and developers who want colors, fast.</p>
          <Link
            href="/palette"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 px-5 py-2.5 rounded-xl transition-all duration-200 bg-zinc-900/40 hover:bg-zinc-800/60 active:scale-95"
          >
            <Wind className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            Try it now — it&apos;s free
          </Link>
        </section>
      </FadeUp>

    </div>
  );
}
