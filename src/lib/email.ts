import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "noreply@falkvard.dk";
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

export function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS && NOTIFY_EMAIL);
}

function getTransport() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    requireTLS: SMTP_PORT !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image_urls?: string[];
}

interface BookingData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  service: string;
  placement?: string | null;
  size?: string | null;
  description?: string | null;
  reference_urls?: string | null;
  chat_history?: string | null;
  source: "web" | "agent";
}

// ---------------------------------------------------------------------------
// HTML email builder
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildChatHtml(chatJson: string): string {
  let messages: ChatMessage[];
  try {
    messages = JSON.parse(chatJson);
  } catch {
    return "";
  }
  if (!messages.length) return "";

  const rows = messages
    .map((msg) => {
      const isUser = msg.role === "user";
      const label = isUser ? "Kunde" : "AI Assistent";
      const bgColor = isUser ? "#1a1a1a" : "#111111";
      const borderColor = isUser ? "#333333" : "#222222";
      const labelColor = isUser ? "#cccccc" : "#888888";

      let imagesHtml = "";
      if (msg.image_urls?.length) {
        imagesHtml = msg.image_urls
          .map(
            (url, i) =>
              `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;margin-right:8px;">
                <img src="${escapeHtml(url)}" alt="Design ${i + 1}" style="max-width:240px;border-radius:6px;border:1px solid #333;" />
              </a>`
          )
          .join("");
      }

      return `
        <tr>
          <td style="padding:6px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:12px 16px;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:${labelColor};margin-bottom:6px;">${label}</div>
                  <div style="color:#e0e0e0;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(msg.content)}</div>
                  ${imagesHtml ? `<div style="margin-top:8px;">${imagesHtml}</div>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
      <tr>
        <td style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;padding-bottom:8px;border-bottom:1px solid #222;">
          Fuld samtale
        </td>
      </tr>
      ${rows}
    </table>`;
}

function buildEmailHtml(booking: BookingData): string {
  const isAgent = booking.source === "agent";
  const sourceLabel = isAgent ? "AI Assistent" : "Website formular";

  const details: { label: string; value: string }[] = [
    { label: "Navn", value: booking.name },
    { label: "Email", value: booking.email },
  ];
  if (booking.phone) details.push({ label: "Telefon", value: booking.phone });
  details.push({ label: "Service", value: booking.service });
  if (booking.placement) details.push({ label: "Placering", value: booking.placement });
  if (booking.size) details.push({ label: "Størrelse", value: booking.size });
  if (booking.description) details.push({ label: "Beskrivelse", value: booking.description });
  if (booking.reference_urls) details.push({ label: "Referencer", value: booking.reference_urls });

  const detailRows = details
    .map(
      (d) => `
      <tr>
        <td style="padding:6px 12px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;width:100px;vertical-align:top;">${d.label}</td>
        <td style="padding:6px 12px;color:#e0e0e0;font-size:14px;white-space:pre-wrap;">${escapeHtml(d.value)}</td>
      </tr>`
    )
    .join("");

  const chatHtml = booking.chat_history ? buildChatHtml(booking.chat_history) : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <div style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#666;">Falkvard Tattoo</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:16px 0 8px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Ny booking-forespørgsel</h1>
              <div style="margin-top:8px;font-size:12px;color:#666;">
                Via ${sourceLabel} &middot; ${new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </td>
          </tr>

          <!-- Details card -->
          <tr>
            <td style="padding:16px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111;border:1px solid #222;border-radius:8px;">
                ${detailRows}
              </table>
            </td>
          </tr>

          <!-- Chat history -->
          ${chatHtml ? `<tr><td>${chatHtml}</td></tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;border-top:1px solid #1a1a1a;">
              <div style="font-size:11px;color:#555;">
                Booking ID: ${booking.id}<br />
                Log ind i admin panelet for at godkende eller afvise.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendBookingNotification(booking: BookingData): Promise<void> {
  if (!isEmailConfigured()) {
    console.log("[email] SMTP not configured, skipping email notification");
    return;
  }

  try {
    const transport = getTransport();
    const html = buildEmailHtml(booking);
    const isAgent = booking.source === "agent";

    await transport.sendMail({
      from: SMTP_FROM,
      to: NOTIFY_EMAIL!,
      subject: `Ny booking: ${booking.name} — ${booking.service}${isAgent ? " (via AI)" : ""}`,
      html,
    });

    console.log(`[email] Booking notification sent for ${booking.id}`);
  } catch (err) {
    console.error("[email] Failed to send booking notification:", err);
  }
}
