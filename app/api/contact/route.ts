import { NextRequest, NextResponse } from "next/server";

// ── Security helpers ──────────────────────────────────────────────────────────

/** Escape HTML special chars to prevent XSS / HTML injection in emails */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_PHONE = 30;
const MAX_MESSAGE = 5000;

/** Simple in-memory rate limiter: max 5 requests per IP per hour */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

// ── Resend email sender (compatible con Cloudflare Workers) ──────────────────

async function sendEmail(opts: {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no configurada");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      reply_to: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error (${res.status}): ${body}`);
  }
}

// ── API handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados envíos. Intentá de nuevo más tarde." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.message) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  const name = String(body.name).trim().slice(0, MAX_NAME);
  const email = String(body.email).trim().slice(0, MAX_EMAIL);
  const phone = body.phone ? String(body.phone).trim().slice(0, MAX_PHONE) : "";
  const message = String(body.message).trim().slice(0, MAX_MESSAGE);

  // Validate email format
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  // Reject injection attempts (newlines in header fields)
  if (/[\r\n]/.test(name) || /[\r\n]/.test(email) || /[\r\n]/.test(phone)) {
    return NextResponse.json({ error: "Entrada inválida." }, { status: 400 });
  }

  if (name.length < 2 || message.length < 10) {
    return NextResponse.json({ error: "Nombre o mensaje demasiado corto." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY no configurada");
    return NextResponse.json({ error: "Servidor de correo no disponible." }, { status: 503 });
  }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#1a1a2e;border-bottom:2px solid #c9a84c;padding-bottom:8px;">
        Nueva consulta desde ggpropiedades.com
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#666;width:120px;"><strong>Nombre:</strong></td><td style="padding:8px 0;">${esc(name)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;"><strong>Email:</strong></td><td style="padding:8px 0;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        ${phone ? `<tr><td style="padding:8px 0;color:#666;"><strong>Teléfono:</strong></td><td style="padding:8px 0;"><a href="tel:${esc(phone)}">${esc(phone)}</a></td></tr>` : ""}
      </table>
      <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;font-size:14px;line-height:1.6;">
        <strong>Mensaje:</strong><br>${esc(message).replace(/\n/g, "<br>")}
      </div>
      <p style="font-size:12px;color:#999;margin-top:24px;">
        Enviado desde ggpropiedades.com
      </p>
    </div>
  `;

  try {
    await sendEmail({
      from: "GG Propiedades <noreply@ggpropiedades.com>",
      to: "info@ggpropiedades.com",
      replyTo: email,
      subject: `Consulta web — ${esc(name)}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error enviando email:", err);
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje. Intentá de nuevo." },
      { status: 500 }
    );
  }
}
