import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { escapeHtml } from "../../utils/escapeHtml.js";

/** Strips CR/LF so untrusted input can never inject extra email headers. */
function stripNewlines(value = "") {
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

/**
 * Sends the site owner a notification email when a new contact message
 * arrives. Silently no-ops (logs only) if SMTP isn't configured, so local
 * development doesn't require real credentials.
 */
export async function sendContactNotification({ name, email, subject, message }) {
  const mailer = getTransporter();

  if (!mailer) {
    // eslint-disable-next-line no-console
    console.log("[email] SMTP not configured — skipping notification");
    return { sent: false };
  }

  // Defense-in-depth: even though the contact validator already rejects
  // newlines/oversized input, never trust a single layer. Header-bound
  // fields are newline-stripped (prevents header injection); anything
  // rendered into the HTML body is entity-escaped (prevents HTML/script
  // injection into the email the site owner opens).
  const safeName = stripNewlines(name);
  const safeSubject = stripNewlines(subject);
  const safeEmail = stripNewlines(email);

  await mailer.sendMail({
    from: `"Portfolio Contact Form" <${env.SMTP_USER}>`,
    to: env.CONTACT_RECEIVER_EMAIL || env.SMTP_USER,
    replyTo: safeEmail,
    subject: `New portfolio message: ${safeSubject}`,
    text: `From: ${safeName} <${safeEmail}>\n\n${message}`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>New contact message</h2>
        <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      </div>
    `,
  });

  return { sent: true };
}
