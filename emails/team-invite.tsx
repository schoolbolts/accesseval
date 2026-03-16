import React from 'react';
import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';

interface TeamInviteEmailProps {
  orgName: string;
  inviterName: string;
  inviteUrl: string;
}

export default function TeamInviteEmail(props: TeamInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>You've been invited</Text>
          <Text>{props.inviterName} has invited you to join {props.orgName} on AccessEval.</Text>

          <Button href={props.inviteUrl}
            style={{ backgroundColor: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: 6 }}>
            Accept Invitation
          </Button>

          <Text style={{ fontSize: 13, color: '#666' }}>
            This invitation expires in 7 days.
          </Text>

          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>AccessEval — accesseval.com</Text>
        </Container>
      </Body>
    </Html>
  );
}
