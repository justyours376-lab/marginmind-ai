import { tr } from './msgs.ts';

// Creates in-app notifications and emails them to the user (in the user's language).
export async function notifyUser(sr, user, events) {
  const to = user.notification_email || user.email;
  const lang = user.language || 'ne';
  for (const e of events) {
    await sr.entities.Notification.create({ user_id: user.id, type: e.type, severity: e.severity || 'normal', title: e.title, message: e.message, read: false });
    try {
      await sr.integrations.Core.SendEmail({ to, template_name: 'MarginAlert', variables: { title: e.title, message: e.message, brand: tr(lang, 'brand'), tagline: tr(lang, 'tagline'), footer: tr(lang, 'footer') } });
    } catch (err) {
      console.log('email failed', to, err.message);
    }
  }
}