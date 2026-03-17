/**
 * Generate infographic visuals for the Title II blog post.
 * Usage: npx tsx scripts/generate-blog-visuals.ts
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.join(__dirname, '..', 'public', 'blog');

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=Outfit:wght@400;500;600;700&display=swap');`;
const BASE = `
${FONTS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Outfit', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.font-display { font-family: 'Fraunces', Georgia, serif; }
`;

// 1. Timeline graphic — deadlines
function timelineHtml() {
  return `<!DOCTYPE html><html><head><style>${BASE}
    body { background: #f8fafc; padding: 40px; display: flex; justify-content: center; }
    .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px 40px; max-width: 700px; width: 100%; box-shadow: 0 1px 3px rgba(15,23,41,0.04); }
    .title { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 700; color: #0a0f1e; margin-bottom: 24px; text-align: center; }
    .timeline { position: relative; padding-left: 28px; }
    .timeline::before { content: ''; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 3px; background: linear-gradient(to bottom, #059669, #f59e0b, #94a3b8); border-radius: 2px; }
    .event { position: relative; margin-bottom: 28px; }
    .event:last-child { margin-bottom: 0; }
    .dot { position: absolute; left: -24px; top: 4px; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px currentColor; }
    .event-date { font-size: 13px; font-weight: 700; color: currentColor; margin-bottom: 2px; }
    .event-title { font-size: 15px; font-weight: 600; color: #0a0f1e; margin-bottom: 3px; }
    .event-desc { font-size: 13px; color: #64748b; line-height: 1.5; }
    .event.past { color: #059669; }
    .event.upcoming { color: #f59e0b; }
    .event.future { color: #94a3b8; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; margin-left: 8px; }
    .badge-done { background: #ecfdf5; color: #065f46; }
    .badge-soon { background: #fffbeb; color: #92400e; }
  </style></head><body>
    <div class="card">
      <div class="title">ADA Title II Web Accessibility Timeline</div>
      <div class="timeline">
        <div class="event past">
          <div class="dot" style="background:#059669;"></div>
          <div class="event-date">April 24, 2024 <span class="badge badge-done">Complete</span></div>
          <div class="event-title">DOJ publishes final rule</div>
          <div class="event-desc">WCAG 2.1 AA adopted as the binding technical standard for all state and local government websites.</div>
        </div>
        <div class="event past">
          <div class="dot" style="background:#059669;"></div>
          <div class="event-date">June 24, 2024 <span class="badge badge-done">Complete</span></div>
          <div class="event-title">Rule takes effect</div>
          <div class="event-desc">Compliance clock starts. Entities should begin auditing and planning remediation.</div>
        </div>
        <div class="event upcoming">
          <div class="dot" style="background:#f59e0b;"></div>
          <div class="event-date">April 24, 2026 <span class="badge badge-soon">13 months away</span></div>
          <div class="event-title">Deadline: populations 50,000+</div>
          <div class="event-desc">School districts, cities, and counties serving 50,000+ must be WCAG 2.1 AA conformant.</div>
        </div>
        <div class="event future">
          <div class="dot" style="background:#94a3b8;"></div>
          <div class="event-date">April 26, 2027</div>
          <div class="event-title">Deadline: populations under 50,000 + special districts</div>
          <div class="event-desc">Smaller entities, library districts, transit authorities, and all special districts must comply.</div>
        </div>
      </div>
    </div>
  </body></html>`;
}

// 2. Settlement costs comparison
function costsHtml() {
  const items = [
    { label: 'Proactive\ncompliance', cost: '$99–$599/yr', width: 3, color: '#059669', bg: '#ecfdf5' },
    { label: 'Demand letter\nsettlement', cost: '$5K–$25K', width: 18, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Out-of-court\nsettlement', cost: '$25K–$100K', width: 45, color: '#f97316', bg: '#fff7ed' },
    { label: 'Court\njudgment', cost: '$75K+', width: 65, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Class action\nsettlement', cost: '$1M–$6M+', width: 100, color: '#b91c1c', bg: '#fef2f2' },
  ];

  return `<!DOCTYPE html><html><head><style>${BASE}
    body { background: #f8fafc; padding: 40px; display: flex; justify-content: center; }
    .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px 40px; max-width: 700px; width: 100%; box-shadow: 0 1px 3px rgba(15,23,41,0.04); }
    .title { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 700; color: #0a0f1e; margin-bottom: 24px; text-align: center; }
    .row { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
    .row:last-child { margin-bottom: 0; }
    .label { width: 110px; font-size: 12px; font-weight: 600; color: #475569; text-align: right; line-height: 1.3; white-space: pre-line; flex-shrink: 0; }
    .bar-container { flex: 1; }
    .bar { height: 32px; border-radius: 8px; display: flex; align-items: center; padding: 0 12px; transition: width 0.3s; }
    .bar-cost { font-size: 13px; font-weight: 700; white-space: nowrap; }
    .divider { border: none; border-top: 2px dashed #e2e8f0; margin: 18px 0; }
    .note { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 16px; }
  </style></head><body>
    <div class="card">
      <div class="title">Cost of Compliance vs. Cost of a Lawsuit</div>
      ${items.map((item, i) => `
        ${i === 1 ? '<hr class="divider">' : ''}
        <div class="row">
          <div class="label">${item.label}</div>
          <div class="bar-container">
            <div class="bar" style="width:${Math.max(item.width, 20)}%; background:${item.bg}; border: 1px solid ${item.color}20;">
              <span class="bar-cost" style="color:${item.color};">${item.cost}</span>
            </div>
          </div>
        </div>
      `).join('')}
      <div class="note">Figures based on reported settlement ranges. Does not include remediation costs or attorney fees.</div>
    </div>
  </body></html>`;
}

// 3. Lawsuit surge chart
function lawsuitTrendHtml() {
  const years = [
    { year: '2019', count: 2200, label: '2,200' },
    { year: '2020', count: 2500, label: '2,500' },
    { year: '2021', count: 2800, label: '2,800' },
    { year: '2022', count: 3200, label: '3,200' },
    { year: '2023', count: 3500, label: '3,500' },
    { year: '2024', count: 4000, label: '4,000' },
    { year: '2025', count: 5000, label: '5,000+' },
  ];
  const max = 5500;

  return `<!DOCTYPE html><html><head><style>${BASE}
    body { background: #f8fafc; padding: 40px; display: flex; justify-content: center; }
    .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px 40px; max-width: 700px; width: 100%; box-shadow: 0 1px 3px rgba(15,23,41,0.04); }
    .title { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 700; color: #0a0f1e; margin-bottom: 6px; text-align: center; }
    .subtitle { font-size: 13px; color: #64748b; text-align: center; margin-bottom: 28px; }
    .chart { display: flex; align-items: flex-end; gap: 12px; height: 200px; padding: 0 8px; }
    .col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .bar { width: 100%; border-radius: 8px 8px 0 0; transition: height 0.3s; position: relative; }
    .bar-label { font-size: 13px; font-weight: 700; color: #0a0f1e; }
    .year { font-size: 12px; color: #64748b; font-weight: 600; }
    .highlight { position: relative; }
    .highlight .bar { background: linear-gradient(to top, #dc2626, #f87171) !important; }
    .callout { position: absolute; top: -32px; left: 50%; transform: translateX(-50%); background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 2px 10px; font-size: 11px; font-weight: 700; color: #b91c1c; white-space: nowrap; }
    .callout::after { content: ''; position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #fecaca; }
  </style></head><body>
    <div class="card">
      <div class="title">Federal ADA Website Accessibility Lawsuits</div>
      <div class="subtitle">Annual filings, 2019–2025. Source: UsableNet, EcomBack litigation data.</div>
      <div class="chart">
        ${years.map((y, i) => {
          const h = (y.count / max) * 190;
          const isLast = i === years.length - 1;
          const color = isLast ? '#ef4444' : (i >= 5 ? '#f97316' : '#059669');
          return `
            <div class="col ${isLast ? 'highlight' : ''}">
              <div class="bar-label">${y.label}</div>
              <div class="bar" style="height:${h}px; background:${color};"></div>
              <div class="year">${y.year}</div>
              ${isLast ? '<div class="callout">+37% surge</div>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  </body></html>`;
}

// 4. "Who must comply" entity grid
function entitiesHtml() {
  const entities = [
    { icon: '🏫', name: 'School Districts', pop: '50K+ by Apr 2026', note: 'Websites, enrollment portals, parent apps' },
    { icon: '🏛️', name: 'Cities & Towns', pop: '50K+ by Apr 2026', note: 'City websites, online bill pay, permit apps' },
    { icon: '🏢', name: 'Counties', pop: '50K+ by Apr 2026', note: 'County portals, court systems, election sites' },
    { icon: '📚', name: 'Public Libraries', pop: 'All by Apr 2027', note: 'Catalog, event registration, digital resources' },
    { icon: '🚌', name: 'Transit Districts', pop: 'All by Apr 2027', note: 'Route planners, fare payment, rider apps' },
    { icon: '💧', name: 'Special Districts', pop: 'All by Apr 2027', note: 'Water, fire, parks — all sizes' },
  ];

  return `<!DOCTYPE html><html><head><style>${BASE}
    body { background: #f8fafc; padding: 40px; display: flex; justify-content: center; }
    .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px 40px; max-width: 700px; width: 100%; box-shadow: 0 1px 3px rgba(15,23,41,0.04); }
    .title { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 700; color: #0a0f1e; margin-bottom: 24px; text-align: center; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .entity { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .entity-icon { font-size: 24px; margin-bottom: 6px; }
    .entity-name { font-size: 14px; font-weight: 700; color: #0a0f1e; }
    .entity-pop { font-size: 11px; font-weight: 600; color: #059669; background: #ecfdf5; display: inline-block; padding: 1px 8px; border-radius: 6px; margin: 4px 0; }
    .entity-note { font-size: 12px; color: #64748b; line-height: 1.4; }
  </style></head><body>
    <div class="card">
      <div class="title">Who Must Comply with ADA Title II</div>
      <div class="grid">
        ${entities.map(e => `
          <div class="entity">
            <div class="entity-icon">${e.icon}</div>
            <div class="entity-name">${e.name}</div>
            <div class="entity-pop">${e.pop}</div>
            <div class="entity-note">${e.note}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </body></html>`;
}

// 5. Compliance checklist steps
function checklistHtml() {
  const steps = [
    { num: '1', title: 'Run a baseline scan', desc: 'Know where you stand today' },
    { num: '2', title: 'Designate an ADA coordinator', desc: 'Single point of accountability' },
    { num: '3', title: 'Fix critical issues first', desc: 'Missing alt text, form labels, keyboard traps' },
    { num: '4', title: 'Address contrast & navigation', desc: 'Most common issues, easiest wins' },
    { num: '5', title: 'Publish accessibility policy', desc: 'Statement + grievance procedure' },
    { num: '6', title: 'Train content creators', desc: 'Everyone who touches the website' },
    { num: '7', title: 'Set up ongoing monitoring', desc: 'Weekly or monthly automated scans' },
    { num: '8', title: 'Document everything', desc: 'Your strongest defense if a complaint arrives' },
  ];

  return `<!DOCTYPE html><html><head><style>${BASE}
    body { background: #f8fafc; padding: 40px; display: flex; justify-content: center; }
    .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px 40px; max-width: 700px; width: 100%; box-shadow: 0 1px 3px rgba(15,23,41,0.04); }
    .title { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 700; color: #0a0f1e; margin-bottom: 24px; text-align: center; }
    .steps { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .step { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 10px; border: 1px solid #e2e8f0; }
    .step-num { width: 28px; height: 28px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; font-family: 'Fraunces', Georgia, serif; }
    .step-title { font-size: 13px; font-weight: 600; color: #0a0f1e; }
    .step-desc { font-size: 11px; color: #64748b; margin-top: 1px; }
  </style></head><body>
    <div class="card">
      <div class="title">8 Steps to Protect Your Organization</div>
      <div class="steps">
        ${steps.map(s => `
          <div class="step">
            <div class="step-num">${s.num}</div>
            <div>
              <div class="step-title">${s.title}</div>
              <div class="step-desc">${s.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </body></html>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 });

  const visuals: [string, () => string, { width: number; height: number }][] = [
    ['title-ii-timeline', timelineHtml, { width: 780, height: 420 }],
    ['title-ii-costs', costsHtml, { width: 780, height: 440 }],
    ['title-ii-lawsuits', lawsuitTrendHtml, { width: 780, height: 380 }],
    ['title-ii-entities', entitiesHtml, { width: 780, height: 440 }],
    ['title-ii-checklist', checklistHtml, { width: 780, height: 400 }],
  ];

  for (const [name, htmlFn, size] of visuals) {
    console.log(`Generating ${name}...`);
    const page = await context.newPage();
    await page.setViewportSize(size);
    await page.setContent(htmlFn(), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), type: 'png' });
    await page.close();
    console.log(`  ✓ ${name}.png`);
  }

  await browser.close();
  console.log(`\nDone! ${visuals.length} visuals saved to public/blog/`);
}

main().catch(console.error);
