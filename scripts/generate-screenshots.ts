/**
 * Generate marketing screenshots using Playwright.
 * Renders self-contained HTML mockups that match the product design.
 *
 * Usage: npx tsx scripts/generate-screenshots.ts
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.join(__dirname, '..', 'public', 'screenshots');

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=Outfit:wght@400;500;600;700&display=swap');
`;

const BASE_STYLES = `
${FONTS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Outfit', system-ui, sans-serif; background: #f1f5f9; color: #0a0f1e; -webkit-font-smoothing: antialiased; }
.font-display { font-family: 'Fraunces', Georgia, serif; }
.card { background: white; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(15,23,41,0.04), 0 1px 2px rgba(15,23,41,0.06); }
.badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.badge-critical { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.badge-major { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.badge-minor { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
.sidebar { width: 220px; background: #0f1729; color: white; padding: 24px 0; min-height: 100%; }
.sidebar-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; font-size: 14px; color: #94a3b8; font-weight: 500; }
.sidebar-item.active { background: rgba(5,150,105,0.15); color: white; border-right: 3px solid #059669; }
.sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 0 20px 24px; font-size: 16px; font-weight: 700; color: white; }
`;

// SVG icons used in mockups
const ICONS = {
  dashboard: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>',
  issues: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495z" clipRule="evenodd"/></svg>',
  pages: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>',
  reports: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd"/></svg>',
  history: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 20 20" fill="#047857"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/></svg>',
  logo: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="#059669"/><path d="M10 16.5l4 4 8-9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function sidebar(active: string) {
  const items = [
    { name: 'Dashboard', icon: ICONS.dashboard },
    { name: 'Issues', icon: ICONS.issues },
    { name: 'Pages', icon: ICONS.pages },
    { name: 'History', icon: ICONS.history },
    { name: 'Reports', icon: ICONS.reports },
  ];
  return `
    <div class="sidebar">
      <div class="sidebar-logo">${ICONS.logo} AccessEval</div>
      ${items.map(i => `
        <div class="sidebar-item ${i.name === active ? 'active' : ''}">
          ${i.icon} ${i.name}
        </div>
      `).join('')}
    </div>
  `;
}

// ---------- SCREENSHOT 1: Dashboard ----------
function dashboardHtml() {
  const trendBars = [
    { month: 'Oct', score: 34, color: '#ef4444' },
    { month: 'Nov', score: 48, color: '#f97316' },
    { month: 'Dec', score: 56, color: '#f59e0b' },
    { month: 'Jan', score: 64, color: '#f59e0b' },
    { month: 'Feb', score: 72, color: '#10b981' },
    { month: 'Mar', score: 81, color: '#059669' },
  ];

  return `<!DOCTYPE html><html><head><style>${BASE_STYLES}
    .layout { display: flex; min-height: 580px; }
    .main { flex: 1; padding: 28px 32px; background: #f1f5f9; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-family: 'Fraunces', Georgia, serif; font-size: 26px; font-weight: 700; }
    .page-sub { font-size: 13px; color: #64748b; margin-top: 2px; }
    .btn-primary { background: #059669; color: white; padding: 8px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; border: none; display: flex; align-items: center; gap: 6px; }
    .stats-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 14px; margin-bottom: 18px; }
    .stat-card { padding: 20px; text-align: center; }
    .grade-card { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .grade-ring { width: 88px; height: 88px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .grade-letter { font-family: 'Fraunces', Georgia, serif; font-size: 42px; font-weight: 800; }
    .stat-value { font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin-top: 4px; }
    .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .trend-container { padding: 20px; }
    .trend-bars { display: flex; align-items: flex-end; gap: 16px; height: 120px; padding-top: 10px; }
    .trend-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .trend-bar { width: 100%; border-radius: 6px 6px 0 0; min-height: 8px; }
    .trend-label { font-size: 11px; color: #94a3b8; font-weight: 500; }
    .trend-score { font-size: 12px; font-weight: 700; color: #0a0f1e; }
    .summary-card { padding: 20px; }
    .summary-text { font-size: 13px; line-height: 1.7; color: #475569; }
    .summary-text strong { color: #0a0f1e; font-weight: 600; }
  </style></head><body>
    <div class="layout">
      ${sidebar('Dashboard')}
      <div class="main">
        <div class="header">
          <div>
            <div class="page-title">Dashboard</div>
            <div class="page-sub">springfieldschools.org</div>
          </div>
          <button class="btn-primary">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg>
            Run Scan
          </button>
        </div>

        <div class="stats-grid">
          <div class="card grade-card stat-card">
            <div class="grade-ring" style="box-shadow: 0 0 0 4px #34d399;">
              <span class="grade-letter" style="color:#059669;">B</span>
            </div>
            <div style="margin-top:10px; font-family:'Fraunces',serif; font-size:18px; font-weight:700;">81<span style="color:#64748b">/100</span></div>
            <div class="stat-label">Accessibility Score</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value" style="color:#ef4444;">3</div>
            <div class="stat-label">Critical</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value" style="color:#f97316;">8</div>
            <div class="stat-label">Major</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value" style="color:#f59e0b;">12</div>
            <div class="stat-label">Minor</div>
          </div>
        </div>

        <div class="bottom-grid">
          <div class="card trend-container">
            <div class="section-title" style="margin-bottom:14px;">Score Trend</div>
            <div class="trend-bars">
              ${trendBars.map(b => `
                <div class="trend-col">
                  <div class="trend-score">${b.score}</div>
                  <div class="trend-bar" style="height:${b.score * 1.2}px; background:${b.color};"></div>
                  <div class="trend-label">${b.month}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="card summary-card">
            <div class="section-title" style="margin-bottom:10px;">What This Means</div>
            <p class="summary-text">
              Your site has improved significantly — up <strong>47 points since October</strong>. The remaining <strong>3 critical issues</strong> are missing alt text on hero images and form labels on the contact page. Fixing these would likely push your score into the <strong>A range (90+)</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </body></html>`;
}

// ---------- SCREENSHOT 2: Issues with fix instructions ----------
function issuesHtml() {
  const issues = [
    {
      severity: 'critical',
      description: 'Images must have alternate text',
      page: 'Homepage — springfieldschools.org',
      wcag: '1.1.1',
      fix: 'Add a descriptive alt attribute to the hero banner image. Example: alt="Students in Springfield USD classroom". If the image is decorative, use alt="".',
      aiSuggestion: 'In your WordPress editor, click the hero image → in the right panel under "Alt Text", enter: "Students collaborating in a Springfield USD #186 classroom." Then click Update.',
    },
    {
      severity: 'critical',
      description: 'Form elements must have labels',
      page: 'Contact Us — springfieldschools.org/contact',
      wcag: '1.3.1',
      fix: 'Add a visible <label> element associated with the email input field using the "for" attribute matching the input\'s "id".',
      aiSuggestion: null,
    },
    {
      severity: 'major',
      description: 'Color contrast ratio is insufficient',
      page: 'About Us — springfieldschools.org/about',
      wcag: '1.4.3',
      fix: 'The light gray text (#9ca3af) on the white background only has a 2.56:1 contrast ratio. Darken the text to at least #6b7280 for a 4.6:1 ratio.',
      aiSuggestion: null,
    },
    {
      severity: 'major',
      description: 'Links must have discernible text',
      page: 'Staff Directory — springfieldschools.org/staff',
      wcag: '2.4.4',
      fix: 'Replace "click here" link text with descriptive text like "View staff directory" so screen reader users understand the link destination.',
      aiSuggestion: null,
    },
    {
      severity: 'minor',
      description: 'HTML page must have a lang attribute',
      page: 'springfieldschools.org',
      wcag: '3.1.1',
      fix: 'Add lang="en" to the opening <html> tag so assistive technologies know the language of the page.',
      aiSuggestion: null,
    },
  ];

  return `<!DOCTYPE html><html><head><style>${BASE_STYLES}
    .layout { display: flex; min-height: 660px; }
    .main { flex: 1; padding: 28px 32px; background: #f1f5f9; overflow: hidden; }
    .page-title { font-family: 'Fraunces', Georgia, serif; font-size: 26px; font-weight: 700; }
    .page-sub { font-size: 13px; color: #64748b; margin-top: 2px; }
    .filters { display: flex; gap: 8px; margin: 20px 0 16px; align-items: center; }
    .pill { padding: 5px 16px; border-radius: 9999px; font-size: 13px; font-weight: 500; border: 1px solid #e2e8f0; background: white; color: #64748b; }
    .pill.active { background: #059669; color: white; border-color: #059669; }
    .pill-count { margin-left: auto; font-size: 13px; color: #64748b; }
    .issue-card { overflow: hidden; margin-bottom: 8px; }
    .issue-header { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; }
    .issue-body { flex: 1; min-width: 0; }
    .issue-desc { font-size: 13px; font-weight: 500; color: #0a0f1e; line-height: 1.4; }
    .issue-page { font-size: 11px; color: #64748b; margin-top: 3px; }
    .issue-wcag { display: inline-block; margin-top: 5px; font-size: 11px; color: #64748b; background: #f1f5f9; border-radius: 8px; padding: 2px 8px; }
    .issue-actions { display: flex; gap: 12px; align-items: center; flex-shrink: 0; }
    .issue-btn { font-size: 12px; font-weight: 500; color: #059669; background: none; border: none; cursor: pointer; }
    .issue-btn.muted { color: #94a3b8; }
    .expanded { border-top: 1px solid #f1f5f9; padding: 16px; background: #f8fafc; }
    .fix-section { margin-bottom: 14px; }
    .fix-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 6px; }
    .fix-text { font-size: 13px; color: #475569; line-height: 1.6; }
    .ai-box { background: #ecfdf5; border-left: 4px solid #34d399; border-radius: 0 12px 12px 0; padding: 12px 16px; }
    .ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .ai-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #065f46; }
    .ai-copy { font-size: 11px; font-weight: 500; color: #047857; }
    .ai-text { font-size: 13px; color: #064e3b; line-height: 1.6; }
  </style></head><body>
    <div class="layout">
      ${sidebar('Issues')}
      <div class="main">
        <div>
          <div class="page-title">Issues</div>
          <div class="page-sub">23 issues from latest scan — Mar 15, 2026</div>
        </div>
        <div class="filters">
          <span class="pill active">All</span>
          <span class="pill">Critical</span>
          <span class="pill">Major</span>
          <span class="pill">Minor</span>
          <span class="pill-count">23 shown</span>
        </div>
        ${issues.map((issue, i) => `
          <div class="card issue-card">
            <div class="issue-header">
              <span class="badge badge-${issue.severity}">${issue.severity}</span>
              <div class="issue-body">
                <div class="issue-desc">${issue.description}</div>
                <div class="issue-page">${issue.page}</div>
                <span class="issue-wcag">WCAG ${issue.wcag}</span>
              </div>
              <div class="issue-actions">
                <span class="issue-btn">Fixed</span>
                <span class="issue-btn muted">Ignore</span>
                <span class="issue-btn">${i === 0 ? 'Collapse' : 'Details'}</span>
              </div>
            </div>
            ${i === 0 ? `
              <div class="expanded">
                <div class="fix-section">
                  <div class="fix-title">How to fix</div>
                  <div class="fix-text">${issue.fix}</div>
                </div>
                ${issue.aiSuggestion ? `
                  <div class="ai-box">
                    <div class="ai-header">
                      <span class="ai-label">✨ AI Suggested Fix</span>
                      <span class="ai-copy">Copy</span>
                    </div>
                    <div class="ai-text">${issue.aiSuggestion}</div>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  </body></html>`;
}

// ---------- SCREENSHOT 3: Pages table ----------
function pagesHtml() {
  const pages = [
    { title: 'Homepage', url: '/', score: 92, issues: 2, status: 'scanned' },
    { title: 'About Us', url: '/about', score: 85, issues: 5, status: 'scanned' },
    { title: 'Staff Directory', url: '/staff', score: 78, issues: 8, status: 'scanned' },
    { title: 'Contact Us', url: '/contact', score: 64, issues: 11, status: 'scanned' },
    { title: 'Calendar', url: '/calendar', score: 56, issues: 14, status: 'scanned' },
    { title: 'School Board', url: '/board', score: 88, issues: 3, status: 'scanned' },
    { title: 'Enrollment', url: '/enrollment', score: 71, issues: 7, status: 'scanned' },
    { title: 'Transportation', url: '/transportation', score: 95, issues: 1, status: 'scanned' },
    { title: 'Lunch Menu', url: '/lunch', score: 43, issues: 19, status: 'scanned' },
    { title: 'Athletics', url: '/athletics', score: 61, issues: 13, status: 'scanned' },
  ];

  function scoreColor(s: number) {
    if (s >= 90) return '#047857';
    if (s >= 70) return '#2563eb';
    if (s >= 50) return '#d97706';
    return '#dc2626';
  }

  return `<!DOCTYPE html><html><head><style>${BASE_STYLES}
    .layout { display: flex; min-height: 580px; }
    .main { flex: 1; padding: 28px 32px; background: #f1f5f9; }
    .page-title { font-family: 'Fraunces', Georgia, serif; font-size: 26px; font-weight: 700; }
    .page-sub { font-size: 13px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { border-bottom: 1px solid #f1f5f9; background: rgba(241,245,249,0.6); }
    th { padding: 12px 18px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
    th.center { text-align: center; }
    td { padding: 12px 18px; border-bottom: 1px solid #f1f5f9; }
    td.center { text-align: center; }
    tr:hover { background: rgba(241,245,249,0.5); }
    .page-name { font-weight: 500; color: #0a0f1e; }
    .page-url { font-size: 11px; color: #64748b; margin-top: 2px; }
    .score { font-family: 'Fraunces', Georgia, serif; font-size: 15px; font-weight: 700; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #ecfdf5; color: #065f46; }
  </style></head><body>
    <div class="layout">
      ${sidebar('Pages')}
      <div class="main">
        <div style="margin-bottom:24px;">
          <div class="page-title">Pages</div>
          <div class="page-sub">47 pages from latest scan — Mar 15, 2026</div>
        </div>
        <div class="card" style="overflow:hidden;">
          <table>
            <thead><tr>
              <th>Page</th>
              <th class="center">Score</th>
              <th class="center">Issues</th>
              <th class="center">Status</th>
            </tr></thead>
            <tbody>
              ${pages.map(p => `
                <tr>
                  <td>
                    <div class="page-name">${p.title}</div>
                    <div class="page-url">springfieldschools.org${p.url}</div>
                  </td>
                  <td class="center"><span class="score" style="color:${scoreColor(p.score)}">${p.score}</span></td>
                  <td class="center" style="color:#475569;">${p.issues}</td>
                  <td class="center"><span class="status-badge">${p.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </body></html>`;
}

// ---------- SCREENSHOT 4: Free scan report card ----------
function reportCardHtml() {
  return `<!DOCTYPE html><html><head><style>${BASE_STYLES}
    body { background: #f1f5f9; display: flex; justify-content: center; padding: 32px; }
    .report { max-width: 560px; width: 100%; }
    .report-header { text-align: center; padding: 28px 32px 24px; }
    .report-logo { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; font-weight: 600; color: #059669; margin-bottom: 20px; }
    .report-org { font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: #0a0f1e; }
    .report-meta { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .grade-section { display: flex; align-items: center; justify-content: center; gap: 32px; padding: 24px 32px; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
    .grade-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #fef3c7, #fde68a); }
    .grade-letter { font-family: 'Fraunces', Georgia, serif; font-size: 38px; font-weight: 800; color: #d97706; }
    .grade-details { font-size: 13px; color: #475569; line-height: 1.8; }
    .grade-details strong { color: #0a0f1e; font-weight: 600; }
    .issues-section { padding: 24px 32px; }
    .issue-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8fafc; }
    .issue-info { flex: 1; }
    .issue-name { font-size: 13px; font-weight: 500; color: #0a0f1e; }
    .issue-explain { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .issue-count { font-size: 13px; font-weight: 600; color: #475569; margin-right: 12px; }
    .cta { display: block; margin: 24px 32px 28px; padding: 12px; background: #059669; color: white; text-align: center; border-radius: 12px; font-size: 14px; font-weight: 600; text-decoration: none; }
  </style></head><body>
    <div class="report card">
      <div class="report-header">
        <div class="report-logo">${ICONS.logo} AccessEval</div>
        <div class="report-org">Springfield USD #186</div>
        <div class="report-meta">springfieldschools.org · Scanned Mar 15, 2026</div>
      </div>
      <div class="grade-section">
        <div class="grade-circle">
          <span class="grade-letter">C+</span>
        </div>
        <div class="grade-details">
          <div>Overall Score: <strong>68 / 100</strong></div>
          <div>Pages Scanned: <strong>47</strong></div>
          <div>Issues Found: <strong>23</strong></div>
        </div>
      </div>
      <div class="issues-section">
        <div class="section-title" style="margin-bottom:12px;">Top Accessibility Issues</div>
        ${[
          { name: 'Images are missing alt text', explain: 'Screen readers cannot describe these images to visually impaired users.', count: '18 instances', badge: 'critical' },
          { name: 'Color contrast is too low', explain: 'Text doesn\'t meet the 4.5:1 contrast ratio required by WCAG AA.', count: '14 instances', badge: 'major' },
          { name: 'Links have no descriptive text', explain: 'Links labeled "click here" or "read more" are unclear without context.', count: '11 instances', badge: 'major' },
          { name: 'Form inputs are missing labels', explain: 'Screen readers can\'t identify what information each field expects.', count: '8 instances', badge: 'critical' },
        ].map(i => `
          <div class="issue-row">
            <div class="issue-info">
              <div class="issue-name">${i.name}</div>
              <div class="issue-explain">${i.explain}</div>
            </div>
            <div class="issue-count">${i.count}</div>
            <span class="badge badge-${i.badge}">${i.badge}</span>
          </div>
        `).join('')}
      </div>
      <a class="cta" href="#">Get Your Full Report →</a>
    </div>
  </body></html>`;
}

// ---------- SCREENSHOT 5: AI fix detail ----------
function aiFixHtml() {
  return `<!DOCTYPE html><html><head><style>${BASE_STYLES}
    body { background: #f1f5f9; padding: 32px; display: flex; justify-content: center; }
    .container { max-width: 620px; width: 100%; }
    .issue-header { display: flex; align-items: flex-start; gap: 12px; padding: 18px 20px; }
    .issue-desc { font-size: 15px; font-weight: 600; color: #0a0f1e; }
    .issue-page { font-size: 12px; color: #64748b; margin-top: 4px; }
    .issue-wcag { display: inline-block; margin-top: 6px; font-size: 11px; color: #64748b; background: #f1f5f9; border-radius: 8px; padding: 2px 8px; }
    .expanded { border-top: 1px solid #f1f5f9; padding: 20px; background: #f8fafc; }
    .fix-section { margin-bottom: 18px; }
    .fix-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 8px; }
    .fix-text { font-size: 13px; color: #475569; line-height: 1.7; }
    .ai-box { background: #ecfdf5; border-left: 4px solid #34d399; border-radius: 0 12px 12px 0; padding: 16px 20px; }
    .ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .ai-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #065f46; }
    .ai-copy { font-size: 12px; font-weight: 500; color: #047857; cursor: pointer; }
    .ai-text { font-size: 13px; color: #064e3b; line-height: 1.7; }
    .code-block { margin-top: 10px; background: white; border: 1px solid #d1fae5; border-radius: 10px; padding: 12px 16px; font-family: 'Menlo', monospace; font-size: 12px; color: #064e3b; line-height: 1.6; white-space: pre-wrap; }
    .element-section { margin-top: 18px; }
    .element-code { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; font-family: 'Menlo', monospace; font-size: 11px; color: #475569; overflow-x: auto; }
    .screenshot-section { margin-top: 18px; }
    .screenshot-placeholder { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; }
    .screenshot-box { background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px; padding: 40px; display: flex; align-items: center; justify-content: center; }
    .highlight-box { border: 3px solid #ef4444; border-radius: 4px; padding: 12px 20px; background: rgba(239,68,68,0.05); }
    .highlight-img { background: #e2e8f0; border-radius: 2px; width: 200px; height: 24px; }
  </style></head><body>
    <div class="container">
      <div class="card" style="overflow:hidden;">
        <div class="issue-header">
          <span class="badge badge-critical">critical</span>
          <div>
            <div class="issue-desc">Images must have alternate text</div>
            <div class="issue-page">Homepage — springfieldschools.org</div>
            <span class="issue-wcag">WCAG 1.1.1</span>
          </div>
        </div>
        <div class="expanded">
          <div class="fix-section">
            <div class="fix-title">What's wrong</div>
            <div class="fix-text">The hero banner image has no alt attribute. Screen readers will announce it as "image" with no description, leaving visually impaired visitors unable to understand the content.</div>
          </div>

          <div class="fix-section">
            <div class="fix-title">How to fix</div>
            <div class="fix-text">Add a descriptive alt attribute to the hero banner image that conveys the purpose and content of the image.</div>
          </div>

          <div class="ai-box">
            <div class="ai-header">
              <span class="ai-label">✨ AI Suggested Fix — WordPress</span>
              <span class="ai-copy">Copy</span>
            </div>
            <div class="ai-text">
              In your WordPress editor, click the hero banner image. In the right panel under <strong>Image Settings → Alt Text</strong>, enter:
            </div>
            <div class="code-block">"Students collaborating in a Springfield USD #186 classroom during a hands-on science project"</div>
            <div class="ai-text" style="margin-top:10px;">Then click <strong>Update</strong> to save the page.</div>
          </div>

          <div class="element-section">
            <div class="fix-title">Element HTML</div>
            <div class="element-code">&lt;img src="/wp-content/uploads/hero-banner.jpg" class="wp-image-1234" width="1200" height="400"&gt;</div>
          </div>
        </div>
      </div>
    </div>
  </body></html>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  const screenshots: [string, string, () => string, { width: number; height: number }?][] = [
    ['dashboard', 'Dashboard overview', dashboardHtml, { width: 1280, height: 580 }],
    ['issues', 'Issues with fix instructions', issuesHtml, { width: 1280, height: 660 }],
    ['pages', 'Pages breakdown table', pagesHtml, { width: 1280, height: 580 }],
    ['report', 'Free scan report card', reportCardHtml, { width: 640, height: 700 }],
    ['ai-fix', 'AI fix suggestion detail', aiFixHtml, { width: 700, height: 680 }],
  ];

  for (const [name, desc, htmlFn, size] of screenshots) {
    console.log(`Generating ${name} (${desc})...`);
    const page = await context.newPage();
    if (size) {
      await page.setViewportSize(size);
    }
    await page.setContent(htmlFn(), { waitUntil: 'networkidle' });
    // Wait for fonts to load
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUT_DIR, `${name}.png`),
      type: 'png',
    });
    await page.close();
    console.log(`  ✓ ${name}.png`);
  }

  await browser.close();
  console.log(`\nDone! ${screenshots.length} screenshots saved to public/screenshots/`);
}

main().catch(console.error);
