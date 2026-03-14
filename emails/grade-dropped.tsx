import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components';

interface GradeDroppedEmailProps {
  orgName: string;
  previousGrade: string;
  currentGrade: string;
  previousScore: number;
  currentScore: number;
  dashboardUrl: string;
}

export default function GradeDroppedEmail(props: GradeDroppedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#dc2626' }}>Grade Dropped</Text>
          <Text>Your website accessibility grade for {props.orgName} has decreased.</Text>
          <Section style={{ textAlign: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 8 }}>
            <Text style={{ fontSize: 24, color: '#666' }}>{props.previousGrade} ({props.previousScore}) → {props.currentGrade} ({props.currentScore})</Text>
          </Section>
          <Text>New issues may have been introduced. Review them on your dashboard.</Text>
          <Button href={props.dashboardUrl}
            style={{ backgroundColor: '#dc2626', color: '#fff', padding: '12px 24px', borderRadius: 6 }}>
            Review Issues
          </Button>
          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>AccessEval — accesseval.com</Text>
        </Container>
      </Body>
    </Html>
  );
}
