import { NextResponse } from "next/server";
import { Resend } from "resend";

// Resend's SDK uses the Node.js runtime (not Edge).
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
// Optional: a verified sender, e.g. "Oneman <hello@yourdomain.com>".
// If unset, the confirmation email is skipped (the signup is still saved).
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

export async function POST(request: Request) {
  // ── Parse body ──
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const raw =
    typeof (body as { email?: unknown })?.email === "string"
      ? (body as { email: string }).email
      : "";
  const email = raw.trim().toLowerCase();

  // ── Validate ──
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // ── Config guard ──
  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    console.error(
      "Missing RESEND_API_KEY or RESEND_AUDIENCE_ID environment variables."
    );
    return NextResponse.json(
      { error: "Waitlist is not configured yet. Please try again later." },
      { status: 500 }
    );
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    // ── 1. Add the contact to your Resend audience ──
    const { error: contactError } = await resend.contacts.create({
      email,
      audienceId: RESEND_AUDIENCE_ID,
      unsubscribed: false,
    });

    if (contactError) {
      // Resend returns an error if the contact already exists in the audience.
      // Treat that as a successful (idempotent) signup rather than a failure.
      const alreadyExists = /already exists/i.test(contactError.message || "");
      if (!alreadyExists) {
        console.error("Failed to add contact to Resend audience:", contactError);
        return NextResponse.json(
          { error: "Could not save your email. Please try again." },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, alreadyJoined: true });
    }

    // ── 2. Send a confirmation email (optional, best-effort) ──
    if (RESEND_FROM_EMAIL) {
      const { error: emailError } = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject: "You're on the Oneman waitlist",
        text: [
          "Thanks for joining the Oneman waitlist.",
          "",
          "Your first employee never sleeps \u2014 and we'll be in touch soon",
          "with early access and updates.",
          "",
          "\u2014 The Oneman team",
        ].join("\n"),
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
            <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 16px;">You're on the list.</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 16px;">
              Thanks for joining the <strong>Oneman</strong> waitlist. Your first
              employee never sleeps \u2014 and we'll be in touch soon with early
              access and updates.
            </p>
            <p style="font-size: 14px; color: #888; margin: 24px 0 0;">\u2014 The Oneman team</p>
          </div>
        `,
      });

      // Don't fail the signup if the welcome email bounces — just log it.
      if (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error saving waitlist email:", err);
    return NextResponse.json(
      { error: "Could not save your email. Please try again." },
      { status: 500 }
    );
  }
}
