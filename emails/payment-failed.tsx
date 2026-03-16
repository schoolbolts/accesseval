import React from 'react';
import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';

interface PaymentFailedEmailProps {
  orgName: string;
  settingsUrl: string;
}

export default function PaymentFailedEmail(props: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Payment Failed</Text>
          <Text>We were unable to process your payment for {props.orgName}.</Text>
          <Text>Please update your payment method to keep your account active.</Text>
          <Button href={props.settingsUrl}
            style={{ backgroundColor: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: 6 }}>
            Update Payment Method
          </Button>
          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>AccessEval — accesseval.com</Text>
        </Container>
      </Body>
    </Html>
  );
}
