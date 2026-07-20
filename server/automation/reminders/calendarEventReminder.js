const CalendarEvent = require('../../models/CalendarEvent');
const User = require('../../models/User');
const { send } = require('../../config/mailer');
const { notify } = require('../../controllers/notificationController');

async function sendCalendarEventReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const prefix = tomorrow.toISOString().slice(0, 10);

  const events = await CalendarEvent.find({ date: prefix }).lean();
  if (!events.length) return;

  const userIds = [...new Set(events.map((e) => e.user.toString()))];
  const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
  const userMap = {};
  for (const u of users) userMap[u._id.toString()] = u;

  for (const event of events) {
    const user = userMap[event.user.toString()];
    if (!user) continue;

    const typeLabel = event.type.charAt(0).toUpperCase() + event.type.slice(1);
    const timeStr = event.time ? ` at ${event.time}` : '';

    await notify({
      user: event.user,
      type: 'general',
      title: `⏰ Tomorrow: ${event.title}`,
      body: `${typeLabel}${timeStr}`,
      link: '/me/calendar',
    }).catch(() => {});

    if (user.email) {
      try {
        await send({
          to: [{ name: user.name, email: user.email }],
          subject: `⏰ Reminder: ${event.title} is tomorrow`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#1f2937">Upcoming event reminder</h2>
              <p style="color:#4b5563">Hi ${user.name},</p>
              <p style="color:#4b5563">Just a heads-up — you have something coming up tomorrow.</p>
              <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0">
                <p style="margin:0 0 4px;font-weight:600;font-size:16px;color:#1f2937">${event.title}</p>
                <p style="margin:0;color:#6b7280;font-size:14px">${typeLabel} — ${event.date}${timeStr}</p>
                ${event.description ? `<p style="margin:8px 0 0;color:#6b7280;font-size:13px">${event.description}</p>` : ''}
              </div>
              <a href="${process.env.BASE_URL || 'http://localhost:5173'}/me/calendar" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:14px">View in calendar</a>
            </div>
          `,
        });
      } catch {
        // email failed silently
      }
    }
  }
  console.log(`[calendar-reminder] Sent reminders for ${events.length} event(s) tomorrow`);
}

module.exports = { sendCalendarEventReminders };
