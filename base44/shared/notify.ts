import { tr } from './msgs.ts';

// Builds a notification event. title/message are rendered now (for the email); title_key/msg_key/vars let the app
// re-render the same notification in whatever language the seller has selected later. `extra` may hold severity and link.
export function mkEvent(lang, type, titleKey, titleVars, msgKey, msgVars, extra = {}) {
  return {
    type, title: tr(lang, titleKey, titleVars), message: tr(lang, msgKey, msgVars),
    title_key: titleKey, msg_key: msgKey, vars: { ...titleVars, ...msgVars }, ...extra,
  };
}

// Creates in-app notifications and emails them to the user (in the user's preferred language).
export async function notifyUser(sr, user, events) {
  const to = user.notification_email || user.email;
  const lang = user.preferred_language || 'ne';
  for (const e of events) {
    await sr.entities.Notification.create({
      user_id: user.id, type: e.type, severity: e.severity || 'normal', title: e.title, message: e.message,
      title_key: e.title_key, msg_key: e.msg_key, vars: e.vars, link: e.link, read: false,
    });
    try {
      await sr.integrations.Core.SendEmail({ to, template_name: 'MarginAlert', variables: { title: e.title, message: e.message, brand: tr(lang, 'brand'), tagline: tr(lang, 'tagline'), footer: tr(lang, 'footer') } });
    } catch (err) {
      console.log('email failed', to, err.message);
    }
  }
}