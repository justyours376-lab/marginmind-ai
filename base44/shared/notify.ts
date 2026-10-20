// Creates in-app notifications and emails them to the user.
export async function notifyUser(sr, user, events) {
  const to = user.notification_email || user.email;
  for (const e of events) {
    await sr.entities.Notification.create({ user_id: user.id, type: e.type, title: e.title, message: e.message, read: false });
    try {
      await sr.integrations.Core.SendEmail({ to, template_name: 'MarginAlert', variables: { title: e.title, message: e.message } });
    } catch (err) {
      console.log('email failed', to, err.message);
    }
  }
}