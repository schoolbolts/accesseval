import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { render } from '@react-email/components';

const ses = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@accesseval.com';

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [params.to] },
    Message: {
      Subject: { Data: params.subject },
      Body: { Html: { Data: params.html } },
    },
  });

  await ses.send(command);
}

export async function sendTemplateEmail(params: {
  to: string;
  subject: string;
  component: React.ReactElement;
}) {
  const html = await render(params.component);
  await sendEmail({ to: params.to, subject: params.subject, html });
}
