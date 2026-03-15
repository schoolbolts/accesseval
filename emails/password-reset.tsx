import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';

interface PasswordResetEmailProps {
  resetUrl: string;
}

export default function PasswordResetEmail(props: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Reset your password</Text>
          <Text>We received a request to reset the password for your AccessEval account. Click the button below to choose a new password.</Text>

          <Button href={props.resetUrl}
            style={{ backgroundColor: '#059669', color: '#fff', padding: '12px 24px', borderRadius: 6 }}>
            Reset Password
          </Button>

          <Text style={{ fontSize: 13, color: '#666' }}>
            This link expires in 1 hour. If you didn&apos;t request a password reset, you can safely ignore this email.
          </Text>

          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>AccessEval — accesseval.com</Text>
        </Container>
      </Body>
    </Html>
  );
}
