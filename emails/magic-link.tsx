import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';

interface MagicLinkEmailProps {
  loginUrl: string;
}

export default function MagicLinkEmail(props: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Sign in to AccessEval</Text>
          <Text>Click the button below to sign in to your account. No password needed.</Text>

          <Button href={props.loginUrl}
            style={{ backgroundColor: '#059669', color: '#fff', padding: '12px 24px', borderRadius: 6 }}>
            Sign In
          </Button>

          <Text style={{ fontSize: 13, color: '#666' }}>
            This link expires in 15 minutes. If you didn&apos;t request this, you can safely ignore this email.
          </Text>

          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>AccessEval — accesseval.com</Text>
        </Container>
      </Body>
    </Html>
  );
}
