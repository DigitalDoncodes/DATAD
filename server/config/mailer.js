// Brevo (Sendinblue) transactional email via HTTP API — no SDK needed.
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const enabled = () => Boolean(process.env.BREVO_API_KEY && process.env.MAIL_FROM);

const send = async ({ to, subject, html }) => {
  if (!enabled()) {
    console.warn('Mailer disabled: BREVO_API_KEY or MAIL_FROM not set');
    return;
  }
  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'DATAD', email: process.env.MAIL_FROM },
      to,
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
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
  });

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
  });

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
  });

exports.sendAnnouncementEmail = (recipients, announcement) =>
  send({
    to: recipients.map((u) => ({ email: u.email, name: u.name })),
    subject: `📢 ${announcement.title}`,
    html: wrap(announcement.title, `<p>${announcement.body.replace(/\n/g, '<br/>')}</p>`),
  });
