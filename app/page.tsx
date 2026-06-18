"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import Lenis from "lenis";
import { MetalButton } from "@/components/metal-button";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2 });
    let raf: number;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitted) return;

    gsap.to(formRef.current, {
      opacity: 0,
      y: -8,
      filter: "blur(4px)",
      duration: 0.35,
      ease: "power2.inOut",
      onComplete: () => setSubmitted(true),
    });
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center overflow-hidden bg-[#080808]">

      {/* Background staircase */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-screen">
          <Image
            src="/onemanbg.png"
            alt=""
            fill
            priority
            className="object-cover w-full h-screen"
          />
        </div>
      </div>

      {/* Page corner marks */}
      <span className="corner-mark corner-tl">+</span>
      <span className="corner-mark corner-tr">+</span>
      <span className="corner-mark corner-bl">+</span>
      <span className="corner-mark corner-br">+</span>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 flex flex-col items-center pt-14 pb-0 flex-1">

        {/* Logo */}
        <div className="mb-7">
          <Image
            src="/onemanlogo.png"
            alt="Oneman"
            width={54}
            height={54}
            className="logo-img"
            priority
          />
        </div>

        {/* Badge */}
        <div className="badge">
          <span className="badge-text">ai that runs your company</span>
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
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="email-input"
                />
                <MetalButton type="submit" className="submit-btn">
                  Join the waitlist!
                </MetalButton>
              </form>
            </div>
          )}
        </div>

        {/* Terminal window */}
        <div className="terminal-window">
          <div className="terminal-titlebar">
            <span className="terminal-dot terminal-dot-red" />
            <span className="terminal-dot terminal-dot-yellow" />
            <span className="terminal-dot terminal-dot-green" />
          </div>
          <div className="terminal-body">
            <p className="terminal-muted">Last login: Wed Mar 18 18:23:40 on ttys00</p>
            <p>
              <span className="terminal-prompt">oneman:~ $</span>
              {" draft outreach email to 50 leads"}
            </p>
            <p className="terminal-output">Writing personalised emails... sent to 50 contacts.</p>
            <p>
              <span className="terminal-prompt">oneman:~ $</span>
              {" schedule investor call for thursday"}
            </p>
            <p className="terminal-output">Calendar updated. Invite sent to 3 investors.</p>
            <p>
              <span className="terminal-prompt">oneman:~ $</span>
              {" "}
              <span className="terminal-cursor" />
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
