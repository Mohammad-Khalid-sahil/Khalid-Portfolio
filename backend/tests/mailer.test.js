import assert from "node:assert/strict";
import { test } from "node:test";

process.env.NODE_ENV = "test";
process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
process.env.CONTACT_RECEIVER_EMAIL = "";

const { sendContactNotification } = await import("../src/integrations/email/mailer.js");

test("unconfigured SMTP skips notifications without logging sender email", async () => {
  const originalLog = console.log;
  const messages = [];
  console.log = (...args) => messages.push(args.join(" "));
  try {
    const result = await sendContactNotification({
      name: "Test Sender",
      email: "private-sender@example.test",
      subject: "Test",
      message: "Disposable test message",
    });

    assert.deepEqual(result, { sent: false });
    assert.equal(messages.length, 1);
    assert.doesNotMatch(messages[0], /private-sender@example\.test/);
    assert.match(messages[0], /SMTP not configured/);
  } finally {
    console.log = originalLog;
  }
});
