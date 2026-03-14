import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components';

interface ScanCompleteEmailProps {
  orgName: string;
  grade: string;
  score: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  dashboardUrl: string;
}

export default function ScanCompleteEmail(props: ScanCompleteEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Scan Complete</Text>
          <Text>Your website scan for {props.orgName} has finished.</Text>

          <Section style={{ textAlign: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 8 }}>
            <Text style={{ fontSize: 48, fontWeight: 'bold', margin: 0 }}>{props.grade}</Text>
            <Text style={{ color: '#666' }}>{props.score}/100</Text>
          </Section>

          <Section style={{ padding: '16px 0' }}>
            <Text>Issues found: {props.criticalCount} critical, {props.majorCount} major, {props.minorCount} minor</Text>
          </Section>

          <Button href={props.dashboardUrl}
            style={{ backgroundColor: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: 6 }}>
            View Dashboard
          </Button>

          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>AccessEval — accesseval.com</Text>
        </Container>
      </Body>
    </Html>
  );
}
