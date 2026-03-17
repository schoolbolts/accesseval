import { Resend } from 'resend';
import { render } from '@react-email/components';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'AccessEval <noreply@mail.accesseval.com>';

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendTemplateEmail(params: {
  to: string;
  subject: string;
  component: React.ReactElement;
}) {
  const html = await render(params.component);
  await sendEmail({ to: params.to, subject: params.subject, html });
}
