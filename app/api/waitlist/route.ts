import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Needs the Node.js runtime for filesystem access (not the Edge runtime).
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "waitlist.json");

type Entry = { email: string; createdAt: string };

async function readEntries(): Promise<Entry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
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

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    // ── Swap this block for your real store in production ──
    // e.g. Supabase / Postgres / Resend audience / Google Sheet / Notion DB.
    // The filesystem on serverless platforms is ephemeral and will reset.
    const entries = await readEntries();

    if (entries.some((e) => e.email === email)) {
      return NextResponse.json({ ok: true, alreadyJoined: true });
    }

    entries.push({ email, createdAt: new Date().toISOString() });
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
    // ───────────────────────────────────────────────────────

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save waitlist email:", err);
    return NextResponse.json(
      { error: "Could not save your email. Please try again." },
      { status: 500 }
    );
  }
}
