"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { MetalButton } from "@/components/metal-button";

// ── Social links (TODO: replace with your real URLs) ──
const TWITTER_URL = "https://x.com/Onemanhq";
const LINKEDIN_URL = "https://linkedin.com/in/shashankpithva";

type LineKind = "muted" | "command" | "output" | "dim" | "comment" | "think" | "task";
type TermLine = { id: number; kind: LineKind; text: string };

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);

  // ── Terminal explainer animation ──
  const [lines, setLines] = useState<TermLine[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  // Keep the terminal pinned to the latest line as content streams in.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const addLine = (kind: LineKind, text: string) => {
      const id = ++idRef.current;
      setLines((prev) => [...prev, { id, kind, text }]);
    };

    const typeLine = async (kind: LineKind, full: string, perChar = 30) => {
      const id = ++idRef.current;
      setLines((prev) => [...prev, { id, kind, text: "" }]);
      let cur = "";
      for (const ch of full) {
        if (cancelled) return;
        cur += ch;
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, text: cur } : l)));
        await sleep(perChar);
      }
    };

    // One full autonomous cycle: research -> decide -> create tasks -> execute -> done
    const cycle = async (
      research: string,
      decision: string,
      tasks: string[],
      result: string
    ) => {
      addLine("dim", "→ researching: " + research + "...");
      await sleep(1150);
      addLine("output", "✓ research complete");
      await sleep(500);
      addLine("think", "◈ decided: " + decision);
      await sleep(950);
      addLine("dim", "→ creating tasks...");
      await sleep(550);
      for (const t of tasks) {
        if (cancelled) return;
        addLine("task", "  [+] " + t);
        await sleep(480);
      }
      await sleep(450);
      addLine("dim", "→ executing...");
      await sleep(1250);
      addLine("output", "✓ done · " + result);
      await sleep(1400);
    };

    async function run() {
      while (!cancelled) {
        setLines([]);
        await sleep(500);
        addLine("muted", "Last login: Wed Mar 18 09:14:22 on ttys000");
        await sleep(550);

        await typeLine("command", "oneman start");
        await sleep(350);
        addLine("output", "Oneman — your autonomous AI co-founder.");
        addLine("comment", "# Give it your company and your goal.");
        addLine("comment", "# It researches, plans, and executes — on its own.");
        await sleep(1600);

        await typeLine("command", "oneman ingest");
        await sleep(300);
        addLine("dim", "→ learning your company...");
        await sleep(850);
        addLine("output", "✓ Company: Acme · B2B SaaS · pre-launch");
        addLine("output", "✓ Goal: land the first 100 paying customers");
        await sleep(1300);

        addLine("comment", "# No more commands needed. Oneman takes over.");
        await sleep(1300);

        await cycle(
          "how early SaaS startups land their first customers",
          "run a founder-led outreach campaign",
          [
            "compile 200 ICP-matched leads",
            "write a 3-step outreach sequence",
            "send & track replies",
          ],
          "147 contacted · 23 replies · 9 demos booked"
        );

        await cycle(
          "what makes B2B demos actually convert",
          "build a tailored demo + follow-up flow",
          [
            "generate a custom demo deck",
            "schedule the 9 demos",
            "set automatic follow-ups",
          ],
          "9 demos scheduled · follow-ups automated"
        );

        await cycle(
          "pricing models for pre-launch SaaS",
          "ship a pricing page with checkout",
          [
            "draft 3 pricing tiers",
            "build the checkout flow",
            "publish the pricing page",
          ],
          "pricing page live · checkout active"
        );

        addLine("think", "◈ goal progress: 14 / 100 customers — and climbing");
        addLine("comment", "# One person. One AI. Infinite leverage.");
        await sleep(3400);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Animate success text in after it mounts
  useEffect(() => {
    if (!submitted || !successRef.current) return;
    gsap.fromTo(
      successRef.current,
      { opacity: 0, y: 10, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }
    );
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || loading || submitted) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (data && data.error) || "Something went wrong. Please try again."
        );
      }

      gsap.to(formRef.current, {
        opacity: 0,
        y: -8,
        filter: "blur(4px)",
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => setSubmitted(true),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderLine = (l: TermLine, isLast: boolean) => {
    const cursor = isLast ? <span className="terminal-cursor" /> : null;
    if (l.kind === "command") {
      return (
        <p key={l.id}>
          <span className="terminal-prompt">oneman:~ $</span>
          {" " + l.text}
          {cursor}
        </p>
      );
    }
    const cls =
      l.kind === "muted"
        ? "terminal-muted"
        : l.kind === "dim"
        ? "terminal-dim"
        : l.kind === "comment"
        ? "terminal-comment"
        : l.kind === "think"
        ? "terminal-think"
        : l.kind === "task"
        ? "terminal-task"
        : "terminal-output";
    return (
      <p key={l.id} className={cls}>
        {l.text}
        {cursor}
      </p>
    );
  };

  return (
    <main className="relative h-screen w-full flex flex-col items-center overflow-hidden bg-[#080808]">

      {/* Background staircase */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-screen">
          <Image
            src="/onemanbg.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover w-full h-screen"
          />
        </div>
        <div className="vignette-sides" />
        <div className="vignette-bottom" />
        <div className="vignette-top" />
        <div className="grain-overlay" />
      </div>

      {/* Page corner marks */}
      <span className="corner-mark corner-tl">+</span>
      <span className="corner-mark corner-tr">+</span>
      <span className="corner-mark corner-bl">+</span>
      <span className="corner-mark corner-br">+</span>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 flex flex-col items-center pt-12 pb-0 flex-1 min-h-0">

        {/* Logo */}
        <div className="mb-6">
          <Image
            src="/onemanlogo.png"
            alt="Oneman"
            width={72}
            height={72}
            className="logo-img"
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="page-heading">
          Your first employee
          <br />
          never sleeps.
        </h1>

        {/* Sub-text */}
        <p className="page-subtext">
          Oneman gives solo founders the power of a full team. One person. One
          AI. Infinite leverage.
        </p>

        {/* Waitlist form */}
        <div className="form-outer">
          {submitted ? (
            <p ref={successRef} className="success-text">
              you&apos;re on the list — we&apos;ll be in touch.
            </p>
          ) : (
            <div ref={formRef} className="relative">
              <span className="crosshair crosshair-tl">+</span>
              <span className="crosshair crosshair-tr">+</span>
              <span className="crosshair crosshair-bl">+</span>
              <span className="crosshair crosshair-br">+</span>
              <form onSubmit={handleSubmit} className="form-row">
                <label htmlFor="waitlist-email" className="sr-only">
                  Your email
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="email-input"
                />
                <MetalButton type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Joining..." : "Join the waitlist!"}
                </MetalButton>
              </form>
              {error && (
                <p
                  role="alert"
                  className="mt-3 text-center font-mono text-[11px] tracking-wide text-red-400"
                >
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Social links — just under the waitlist form */}
        <div className="mt-5 flex items-center justify-center gap-5">
          <a
            href={TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on X (Twitter)"
            className="text-white/40 transition-colors duration-300 hover:text-white/80"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Connect with us on LinkedIn"
            className="text-white/40 transition-colors duration-300 hover:text-white/80"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
            </svg>
          </a>
        </div>

        {/* Terminal window — self-running autonomous explainer (scrolls internally) */}
        <div className="terminal-window">
          <div className="terminal-titlebar">
            <span className="terminal-dot terminal-dot-red" />
            <span className="terminal-dot terminal-dot-yellow" />
            <span className="terminal-dot terminal-dot-green" />
            <span className="terminal-title">oneman — working autonomously</span>
          </div>
          <div className="terminal-body" ref={bodyRef}>
            {lines.map((l, i) => renderLine(l, i === lines.length - 1))}
          </div>
        </div>
      </div>
    </main>
  );
}
