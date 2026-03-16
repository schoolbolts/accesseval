import React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components';

interface WeeklyDigestEmailProps {
  orgName: string;
  grade: string;
  score: number;
  scoreChange: number;
  issuesFixed: number;
  topIssues: { title: string; severity: string }[];
  dashboardUrl: string;
}

export default function WeeklyDigestEmail(props: WeeklyDigestEmailProps) {
  const changeLabel = props.scoreChange > 0
    ? `↑ ${props.scoreChange} points`
    : props.scoreChange < 0
    ? `↓ ${Math.abs(props.scoreChange)} points`
    : 'No change';

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Weekly Accessibility Report</Text>
          <Text>{props.orgName}</Text>

          <Section style={{ textAlign: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 8 }}>
            <Text style={{ fontSize: 48, fontWeight: 'bold', margin: 0 }}>{props.grade}</Text>
            <Text style={{ color: '#666' }}>{props.score}/100 ({changeLabel})</Text>
          </Section>

          {props.issuesFixed > 0 && (
            <Text style={{ color: '#16a34a' }}>
              {props.issuesFixed} issue{props.issuesFixed > 1 ? 's' : ''} fixed this week
            </Text>
          )}

          {props.topIssues.length > 0 && (
            <Section>
              <Text style={{ fontWeight: 'bold' }}>Top remaining issues:</Text>
              {props.topIssues.map((issue, i) => (
                <Text key={i} style={{ fontSize: 14 }}>• [{issue.severity}] {issue.title}</Text>
              ))}
            </Section>
          )}

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
