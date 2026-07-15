// Resend transactional email via HTTP API — no SDK needed.
const RESEND_URL = 'https://api.resend.com/emails';
const RESEND_BATCH_URL = 'https://api.resend.com/emails/batch';

const enabled = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

const send = async ({ to, subject, html }) => {
  if (!enabled()) {
    logger.warn('Mailer disabled: RESEND_API_KEY or MAIL_FROM not set');
    return;
  }
  // Resend expects `to` as an array of strings ("Name <email>" or plain email)
  const toAddresses = to.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email));
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `DATAD <${process.env.MAIL_FROM}>`,
      to: toAddresses,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
};

const wrap = (heading, body) => `
  <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px">
    <p style="font-size:22px;font-weight:800;margin:0 0 4px">
      <span style="color:#4f46e5">DATAD</span>
    </p>
    <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin:0 0 20px">
      Technology · Psychology · Impact
    </p>
    <h2 style="font-size:18px;margin:0 0 12px">${heading}</h2>
    <div style="font-size:14px;line-height:1.6;color:#374151">${body}</div>
    <p style="font-size:12px;color:#9ca3af;margin-top:24px">
      You're receiving this because you have an account on DATAD.
    </p>
  </div>`;

exports.sendWelcomeEmail = (user) =>
  send({
    to: [{ email: user.email, name: user.name }],
    subject: 'Welcome to DATAD 🎓',
    html: wrap(
      `Welcome aboard, ${user.name}!`,
      `<p>Your account is ready. Here's what you can do right away:</p>
       <ul>
         <li><strong>Notes</strong> — share and read study notes by subject</li>
         <li><strong>Photos</strong> — relive batch memories in shared albums</li>
         <li><strong>Planner</strong> — track deadlines, case studies and exams</li>
         <li><strong>Finance</strong> — private expense tracker and calculators</li>
         <li><strong>Resume</strong> — build an ATS-friendly resume and export PDF</li>
       </ul>
       <p>See you inside! 🚀</p>`
    ),
  }).catch((err) => logger.error('Welcome email failed:', { error: err.message }));

exports.sendAccountApprovedEmail = (user) =>
  send({
    to: [{ email: user.email, name: user.name }],
    subject: 'Your DATAD account is approved ✅',
    html: wrap(
      `You're in, ${user.name}!`,
      `<p>An admin has approved your account — you can now log in and explore everything DATAD offers.</p>
       <p>Your personal referral code is <strong>${user.referralCode}</strong>. It works exactly once —
       share it with one batchmate and they'll skip the approval queue.</p>`
    ),
  }).catch((err) => logger.error('Approval email failed:', { error: err.message }));

exports.sendPasswordResetEmail = (user, link) =>
  send({
    to: [{ email: user.email, name: user.name }],
    subject: 'Reset your DATAD password',
    html: wrap(
      'Password reset requested',
      `<p>We received a request to reset your password. This link is valid for <strong>30 minutes</strong>:</p>
       <p><a href="${link}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
       <p>If the button doesn't work, copy this URL into your browser:<br/>
       <span style="color:#6b7280;word-break:break-all">${link}</span></p>
       <p>If you didn't request this, you can safely ignore this email.</p>`
    ),
  }).catch((err) => logger.error('Reset email failed:', { error: err.message }));

// Fan-out via Resend's batch endpoint: one email per recipient, so nobody
// sees anyone else's address and we stay clear of the 50-recipient `to` cap.
// Batch calls accept up to 100 emails each.
exports.sendAnnouncementEmail = async (recipients, announcement) => {
  if (!enabled()) {
    logger.warn('Mailer disabled: RESEND_API_KEY or MAIL_FROM not set');
    return;
  }
  const subject = `📢 ${announcement.title}`;
  const html = wrap(announcement.title, `<p>${announcement.body.replace(/\n/g, '<br/>')}</p>`);
  const emails = recipients.map((u) => ({
    from: `DATAD <${process.env.MAIL_FROM}>`,
    to: [u.name ? `${u.name} <${u.email}>` : u.email],
    subject,
    html,
  }));

  for (let i = 0; i < emails.length; i += 100) {
    const res = await fetch(RESEND_BATCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emails.slice(i, i + 100)),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend batch ${res.status}: ${body}`);
    }
  }
};
