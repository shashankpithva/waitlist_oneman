import { NextResponse } from "next/server";
import { Resend } from "resend";

// Resend's SDK uses the Node.js runtime (not Edge).
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
// Optional: a verified sender, e.g. "Oneman <hello@onemanhq.tech>".
// If unset, the confirmation email is skipped (the signup is still saved).
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

// ── Brand constants (edit these to rebrand the email) ──
const SITE_URL = "https://www.shashankpithva.app/";
const LOGO_URL = "https://www.onemanhq.tech/onemanlogo.png";

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
        // Plain-text fallback (keep roughly in sync with the HTML below).
        text: [
          "You're on the list.",
          "",
          "Thanks for joining the Oneman waitlist. We're building the AI",
          "co-founder that helps you run your company solo \u2014 your first",
          "employee that never sleeps.",
          "",
          "We'll be in touch soon with early access and updates.",
          "",
          "Visit our current work: " + SITE_URL,
          "",
          "\u2014 The Oneman team",
        ].join("\n"),
        // Dark, premium HTML email. All styles are inline (required for email).
        html: `
  <body style="margin:0;padding:0;background-color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#111111;border:1px solid #262626;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 0;text-align:center;">
                <img src="${LOGO_URL}" alt="Oneman" width="56" height="56" style="display:inline-block;width:56px;height:auto;border:0;outline:none;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 0;text-align:center;">
                <h1 style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.4px;color:#ffffff;">You're on the list.</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 40px 0;text-align:center;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#a1a1aa;">
                  Thanks for joining the <strong style="color:#e4e4e7;">Oneman</strong> waitlist. We're building the AI co-founder that helps you run your company solo &mdash; your first employee that never sleeps.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 0;text-align:center;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#a1a1aa;">
                  We'll be in touch soon with early access and updates.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 8px;text-align:center;">
                <a href="${SITE_URL}" style="display:inline-block;background-color:#ffffff;color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:9999px;">Visit website</a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 40px;text-align:center;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#52525b;border-top:1px solid #1f1f1f;padding-top:24px;">
                  &mdash; The Oneman team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
        `,
      });

      // Don't fail the signup if the welcome email bounces \u2014 just log it.
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
