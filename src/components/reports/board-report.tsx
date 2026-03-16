import { Document, Page, Text, View, StyleSheet, Svg, Path } from '@react-pdf/renderer';

// ─── Brand colors ───────────────────────────────────────────────────────────

const C = {
  emerald: '#047857',
  emeraldLight: '#ecfdf5',
  emeraldMid: '#d1fae5',
  navy: '#0a0f1e',
  slate700: '#334155',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  white: '#ffffff',
  red: '#dc2626',
  redLight: '#fef2f2',
  orange: '#ea580c',
  orangeLight: '#fff7ed',
  amber: '#d97706',
  amberLight: '#fffbeb',
};

// ─── Grade color helpers ────────────────────────────────────────────────────

function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#047857';
  if (grade.startsWith('B')) return '#2563eb';
  if (grade.startsWith('C')) return '#d97706';
  if (grade.startsWith('D')) return '#ea580c';
  return '#dc2626';
}

function gradeRingColor(grade: string): string {
  if (grade.startsWith('A')) return '#34d399';
  if (grade.startsWith('B')) return '#60a5fa';
  if (grade.startsWith('C')) return '#fbbf24';
  if (grade.startsWith('D')) return '#fb923c';
  return '#f87171';
}

function severityColor(severity: string): string {
  if (severity === 'critical') return C.red;
  if (severity === 'major') return C.orange;
  return C.amber;
}

function severityBg(severity: string): string {
  if (severity === 'critical') return C.redLight;
  if (severity === 'major') return C.orangeLight;
  return C.amberLight;
}

// ─── Logo SVG path (shared) ─────────────────────────────────────────────────

const LOGO_PATH =
  'M61.44,0A61.46,61.46,0,1,1,18,18,61.21,61.21,0,0,1,61.44,0Zm-.39,74.18L52.1,98.91a4.94,4.94,0,0,1-2.58,2.83A5,5,0,0,1,42.7,95.5l6.24-17.28a26.3,26.3,0,0,0,1.17-4,40.64,40.64,0,0,0,.54-4.18c.24-2.53.41-5.27.54-7.9s.22-5.18.29-7.29c.09-2.63-.62-2.8-2.73-3.3l-.44-.1-18-3.39A5,5,0,0,1,27.08,46a5,5,0,0,1,5.05-7.74l19.34,3.63c.77.07,1.52.16,2.31.25a57.64,57.64,0,0,0,7.18.53A81.13,81.13,0,0,0,69.9,42c.9-.1,1.75-.21,2.6-.29l18.25-3.42A5,5,0,0,1,94.5,39a5,5,0,0,1,1.3,7,5,5,0,0,1-3.21,2.09L75.15,51.37c-.58.13-1.1.22-1.56.29-1.82.31-2.72.47-2.61,3.06.08,1.89.31,4.15.61,6.51.35,2.77.81,5.71,1.29,8.4.31,1.77.6,3.19,1,4.55s.79,2.75,1.39,4.42l6.11,16.9a5,5,0,0,1-6.82,6.24,4.94,4.94,0,0,1-2.58-2.83L63,74.23,62,72.4l-1,1.78Zm.39-53.52a8.83,8.83,0,1,1-6.24,2.59,8.79,8.79,0,0,1,6.24-2.59Zm36.35,4.43a51.42,51.42,0,1,0,15,36.35,51.27,51.27,0,0,0-15-36.35Z';

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Cover page — has its own padding since no fixed header
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.slate700,
    backgroundColor: C.white,
    paddingHorizontal: 48,
    paddingTop: 40,
    paddingBottom: 60,
  },

  // Detail pages — extra paddingTop to clear fixed header, extra bottom for footer
  detailPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.slate700,
    backgroundColor: C.white,
    paddingHorizontal: 48,
    paddingTop: 72,
    paddingBottom: 60,
  },

  // Fixed mini-header for detail pages
  miniHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 48,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1 solid ${C.slate200}`,
    backgroundColor: C.white,
  },
  miniHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniHeaderBrand: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
  },
  miniHeaderRight: {
    fontSize: 8,
    color: C.slate400,
  },

  // Cover page elements
  coverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  coverLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBrandName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    letterSpacing: -0.3,
  },
  coverDivider: {
    height: 3,
    backgroundColor: C.emerald,
    borderRadius: 2,
    marginTop: 16,
    marginBottom: 32,
  },
  coverOrgName: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  coverReportTitle: {
    fontSize: 14,
    color: C.slate500,
    marginBottom: 2,
  },
  coverMeta: {
    fontSize: 10,
    color: C.slate400,
    marginBottom: 40,
  },

  // Grade display
  gradeContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  gradeRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gradeText: {
    fontSize: 52,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 13,
    color: C.slate500,
  },
  scoreBold: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
  },

  // Summary narrative
  narrativeBox: {
    backgroundColor: C.slate50,
    borderRadius: 8,
    padding: 20,
    borderLeft: `4 solid ${C.emerald}`,
    marginBottom: 24,
  },
  narrativeTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.emerald,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  narrativeText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: C.slate700,
  },

  // Stat cards row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: C.slate500,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.emerald,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    letterSpacing: -0.2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: C.slate200,
    marginBottom: 16,
  },

  // Issue rows
  issueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottom: `1 solid ${C.slate100}`,
    gap: 10,
  },
  issueSeverityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 1,
  },
  issueSeverityText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  issueContent: {
    flex: 1,
  },
  issueDescription: {
    fontSize: 10,
    color: C.navy,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  issueWcag: {
    fontSize: 8,
    color: C.slate400,
  },

  // Summary rows
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottom: `1 solid ${C.slate100}`,
  },
  summaryLabel: {
    fontSize: 10,
    color: C.slate500,
  },
  summaryValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
  },

  // Compliance checklist
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottom: `1 solid ${C.slate100}`,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    fontSize: 10,
    color: C.slate700,
    flex: 1,
  },
  checkStatus: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Progress box
  progressBox: {
    backgroundColor: C.emeraldLight,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  progressNumber: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: C.emerald,
  },
  progressLabel: {
    fontSize: 10,
    color: C.emerald,
    lineHeight: 1.4,
  },

  // Footer (fixed, repeats on wrapped pages)
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1 solid ${C.slate200}`,
    paddingTop: 10,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 8,
    color: C.slate400,
  },

  // Recommendation box
  recoBox: {
    backgroundColor: C.slate50,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  recoTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    marginBottom: 4,
  },
  recoText: {
    fontSize: 9,
    color: C.slate500,
    lineHeight: 1.5,
  },
});

// ─── Logo components ────────────────────────────────────────────────────────

function Logo({ size: sz }: { size: number }) {
  return (
    <Svg width={sz} height={sz} viewBox="0 0 122.88 122.88">
      <Path fill={C.white} d={LOGO_PATH} />
    </Svg>
  );
}

function SmallLogo({ color }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 122.88 122.88">
      <Path fill={color ?? C.emerald} d={LOGO_PATH} />
    </Svg>
  );
}

// ─── Checkmark / X icons ────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <View style={[s.checkIcon, { backgroundColor: C.emeraldLight }]}>
      <Svg width={10} height={10} viewBox="0 0 20 20">
        <Path
          fill={C.emerald}
          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        />
      </Svg>
    </View>
  );
}

function XIcon() {
  return (
    <View style={[s.checkIcon, { backgroundColor: C.redLight }]}>
      <Svg width={10} height={10} viewBox="0 0 20 20">
        <Path
          fill={C.red}
          d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
        />
      </Svg>
    </View>
  );
}

// ─── Reusable section header ────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View wrap={false}>
      <View style={s.sectionHeader}>
        <View style={s.sectionDot} />
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <View style={s.sectionDivider} />
    </View>
  );
}

// ─── Fixed mini-header for detail pages ─────────────────────────────────────

function DetailPageHeader({ orgName }: { orgName: string }) {
  return (
    <View style={s.miniHeader} fixed>
      <View style={s.miniHeaderLeft}>
        <SmallLogo />
        <Text style={s.miniHeaderBrand}>AccessEval</Text>
      </View>
      <Text style={s.miniHeaderRight}>{orgName} — Accessibility Compliance Report</Text>
    </View>
  );
}

// ─── Fixed footer with dynamic page numbers ─────────────────────────────────

function ReportFooter() {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerLeft}>
        <SmallLogo />
        <Text style={s.footerText}>Generated by AccessEval  |  accesseval.com</Text>
      </View>
      <Text
        style={{ fontSize: 8, color: C.slate400 }}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface BoardReportProps {
  orgName: string;
  siteUrl: string;
  reportDate: string;
  scanDate: string | null;
  grade: string;
  score: number;
  pagesScanned: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  issuesFixed: number;
  summary: string | null;
  topIssues: { description: string; severity: string; wcag: string | null; count: number }[];
  pdfCount: number;
  hasStatement: boolean;
}

// ─── Main report component ──────────────────────────────────────────────────

export function BoardReport(props: BoardReportProps) {
  const totalIssues = props.criticalCount + props.majorCount + props.minorCount;
  const gc = gradeColor(props.grade);
  const grc = gradeRingColor(props.grade);

  // Build recommendations list
  const recos: { title: string; text: string }[] = [];
  let recoNum = 1;
  if (props.criticalCount > 0) {
    recos.push({
      title: `${recoNum++}. Address critical barriers first`,
      text: `${props.criticalCount} critical issue${props.criticalCount !== 1 ? 's' : ''} prevent${props.criticalCount === 1 ? 's' : ''} some users from accessing your website at all. These typically affect screen reader users, keyboard-only users, and people with motor disabilities. Resolving these should be the highest priority.`,
    });
  }
  if (props.majorCount > 0) {
    recos.push({
      title: `${recoNum++}. Resolve major issues for compliance`,
      text: `${props.majorCount} major issue${props.majorCount !== 1 ? 's' : ''} create significant difficulty for users with disabilities. Under ADA Title II, public entities must ensure their websites are accessible. Addressing these issues moves you toward compliance.`,
    });
  }
  if (!props.hasStatement) {
    recos.push({
      title: `${recoNum++}. Publish an accessibility statement`,
      text: 'An accessibility statement demonstrates your commitment to digital inclusion and provides users with a way to report barriers. This is a best practice recommended by WCAG and required by many compliance frameworks.',
    });
  }
  if (recos.length === 0) {
    recos.push({
      title: 'Looking good!',
      text: 'Your website has no critical or major accessibility barriers, and your accessibility statement is published. Continue monitoring with regular scans to maintain compliance as your website content changes.',
    });
  }

  return (
    <Document>
      {/* ═══════════════════ PAGE 1: Cover & Executive Summary ═══════════════════ */}
      <Page size="LETTER" style={s.coverPage}>
        {/* Brand header */}
        <View style={s.coverHeader}>
          <View style={s.coverLogoCircle}>
            <Logo size={22} />
          </View>
          <Text style={s.coverBrandName}>AccessEval</Text>
        </View>
        <View style={s.coverDivider} />

        {/* Report title block */}
        <Text style={s.coverOrgName}>{props.orgName}</Text>
        <Text style={s.coverReportTitle}>Website Accessibility Compliance Report</Text>
        <Text style={s.coverMeta}>
          {props.siteUrl}  |  {props.reportDate}
          {props.scanDate ? `  |  Last scan: ${props.scanDate}` : ''}
        </Text>

        {/* Grade display */}
        <View style={s.gradeContainer}>
          <View style={[s.gradeRing, { borderColor: grc }]}>
            <Text style={[s.gradeText, { color: gc }]}>{props.grade}</Text>
          </View>
          <Text style={s.scoreLabel}>
            Accessibility Score: <Text style={[s.scoreBold, { color: gc }]}>{props.score}</Text>/100
          </Text>
        </View>

        {/* Stat cards */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: C.redLight }]}>
            <Text style={[s.statNumber, { color: C.red }]}>{props.criticalCount}</Text>
            <Text style={s.statLabel}>Critical</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.orangeLight }]}>
            <Text style={[s.statNumber, { color: C.orange }]}>{props.majorCount}</Text>
            <Text style={s.statLabel}>Major</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.amberLight }]}>
            <Text style={[s.statNumber, { color: C.amber }]}>{props.minorCount}</Text>
            <Text style={s.statLabel}>Minor</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.emeraldLight }]}>
            <Text style={[s.statNumber, { color: C.emerald }]}>{props.pagesScanned}</Text>
            <Text style={s.statLabel}>Pages</Text>
          </View>
        </View>

        {/* AI narrative summary */}
        {props.summary && (
          <View style={s.narrativeBox}>
            <Text style={s.narrativeTitle}>Executive Summary</Text>
            <Text style={s.narrativeText}>{props.summary}</Text>
          </View>
        )}

        {/* Progress callout */}
        {props.issuesFixed > 0 && (
          <View style={s.progressBox}>
            <Text style={s.progressNumber}>{props.issuesFixed}</Text>
            <View>
              <Text style={[s.progressLabel, { fontFamily: 'Helvetica-Bold' }]}>
                Issues resolved
              </Text>
              <Text style={s.progressLabel}>since last report period</Text>
            </View>
          </View>
        )}

        <ReportFooter />
      </Page>

      {/* ═══════════════════ PAGES 2+: Details (auto-wraps) ═══════════════════ */}
      <Page size="LETTER" style={s.detailPage} wrap>
        <DetailPageHeader orgName={props.orgName} />

        {/* ── Top issues ── */}
        <SectionHeader title="Top Remaining Issues" />
        {props.topIssues.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 10, color: C.slate400 }}>
              No outstanding issues found.
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 24 }}>
            {props.topIssues.map((issue, i) => (
              <View key={i} style={s.issueRow} wrap={false}>
                <View style={[s.issueSeverityBadge, { backgroundColor: severityBg(issue.severity) }]}>
                  <Text style={[s.issueSeverityText, { color: severityColor(issue.severity) }]}>
                    {issue.severity}
                  </Text>
                </View>
                <View style={s.issueContent}>
                  <Text style={s.issueDescription}>{issue.description}</Text>
                  <Text style={s.issueWcag}>
                    {issue.wcag ? `WCAG ${issue.wcag}` : ''}
                    {issue.wcag && issue.count > 1 ? '  |  ' : ''}
                    {issue.count > 1 ? `${issue.count} instances` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Scan overview ── */}
        <SectionHeader title="Scan Overview" />
        <View style={{ borderRadius: 8, border: `1 solid ${C.slate200}`, marginBottom: 24, overflow: 'hidden' }} wrap={false}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Total issues found</Text>
            <Text style={s.summaryValue}>{totalIssues}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Pages scanned</Text>
            <Text style={s.summaryValue}>{props.pagesScanned}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Issues resolved since last report</Text>
            <Text style={[s.summaryValue, { color: C.emerald }]}>{props.issuesFixed}</Text>
          </View>
          <View style={[s.summaryRow, { borderBottom: 'none' }]}>
            <Text style={s.summaryLabel}>Accessibility grade</Text>
            <Text style={[s.summaryValue, { color: gc }]}>{props.grade} ({props.score}/100)</Text>
          </View>
        </View>

        {/* ── Compliance checklist ── */}
        <SectionHeader title="Compliance Status" />
        <View style={{ borderRadius: 8, border: `1 solid ${C.slate200}`, marginBottom: 24, overflow: 'hidden' }} wrap={false}>
          <View style={s.checkRow}>
            {props.hasStatement ? <CheckIcon /> : <XIcon />}
            <Text style={s.checkLabel}>Accessibility statement published</Text>
            <Text style={[s.checkStatus, { color: props.hasStatement ? C.emerald : C.red }]}>
              {props.hasStatement ? 'Complete' : 'Missing'}
            </Text>
          </View>
          <View style={s.checkRow}>
            {props.criticalCount === 0 ? <CheckIcon /> : <XIcon />}
            <Text style={s.checkLabel}>Zero critical accessibility barriers</Text>
            <Text style={[s.checkStatus, { color: props.criticalCount === 0 ? C.emerald : C.red }]}>
              {props.criticalCount === 0 ? 'Passed' : `${props.criticalCount} remaining`}
            </Text>
          </View>
          <View style={s.checkRow}>
            {props.pdfCount === 0 ? <CheckIcon /> : <XIcon />}
            <Text style={s.checkLabel}>PDF documents reviewed for accessibility</Text>
            <Text style={[s.checkStatus, { color: props.pdfCount === 0 ? C.emerald : C.amber }]}>
              {props.pdfCount === 0 ? 'Complete' : `${props.pdfCount} to review`}
            </Text>
          </View>
          <View style={[s.checkRow, { borderBottom: 'none' }]}>
            {props.score >= 90 ? <CheckIcon /> : <XIcon />}
            <Text style={s.checkLabel}>WCAG 2.1 Level AA target score (90+)</Text>
            <Text style={[s.checkStatus, { color: props.score >= 90 ? C.emerald : C.amber }]}>
              {props.score >= 90 ? 'Met' : `Current: ${props.score}`}
            </Text>
          </View>
        </View>

        {/* ── Recommendations ── */}
        <SectionHeader title="Recommendations" />
        {recos.map((reco, i) => (
          <View key={i} style={s.recoBox} wrap={false}>
            <Text style={s.recoTitle}>{reco.title}</Text>
            <Text style={s.recoText}>{reco.text}</Text>
          </View>
        ))}

        <ReportFooter />
      </Page>
    </Document>
  );
}
