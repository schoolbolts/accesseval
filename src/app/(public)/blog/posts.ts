export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  author: string;
  readTime: string;
  tags: string[];
}

export const posts: BlogPost[] = [
  {
    slug: 'accesseval-vs-wave-school-government-websites',
    title: 'AccessEval vs WAVE: Which Accessibility Tool Is Better for Schools and Governments?',
    description:
      'WAVE is free but limited. AccessEval adds monitoring, plain-English reports, and compliance docs. Here is how they compare for public entities.',
    date: '2026-03-14',
    author: 'AccessEval Team',
    readTime: '6 min',
    tags: ['Comparison', 'Tools', 'WAVE'],
  },
  {
    slug: 'accesseval-vs-siteimprove-public-entities',
    title: 'AccessEval vs Siteimprove: ADA Compliance for Schools and Municipalities',
    description:
      'Siteimprove is powerful but expensive. AccessEval delivers the same core scanning at a fraction of the cost. A comparison for budget-conscious public entities.',
    date: '2026-03-14',
    author: 'AccessEval Team',
    readTime: '6 min',
    tags: ['Comparison', 'Tools', 'Siteimprove'],
  },
  {
    slug: 'accesseval-vs-userway-overlay-widgets',
    title: 'AccessEval vs UserWay: Why Overlays Are Not Enough for ADA Compliance',
    description:
      'UserWay adds an accessibility widget to your site. AccessEval finds and helps you fix the actual code issues. Here is why the difference matters under ADA Title II.',
    date: '2026-03-14',
    author: 'AccessEval Team',
    readTime: '7 min',
    tags: ['Comparison', 'Tools', 'Overlays'],
  },
  {
    slug: 'accesseval-vs-audioeye-school-districts',
    title: 'AccessEval vs AudioEye: Which ADA Compliance Tool Is Right for School Districts?',
    description:
      'A side-by-side comparison of AccessEval and AudioEye for K-12 school districts. Pricing, features, and which one makes sense for small to mid-size districts.',
    date: '2026-03-14',
    author: 'AccessEval Team',
    readTime: '6 min',
    tags: ['Comparison', 'Schools', 'Tools'],
  },
  {
    slug: 'ada-compliance-small-towns-municipalities',
    title: 'ADA Website Compliance for Small Towns and Municipalities Under 50,000',
    description:
      'Cities, counties, and special districts under 50,000 people must make their websites ADA compliant by April 2027. Here is what you need to know and how to do it affordably.',
    date: '2026-03-13',
    author: 'AccessEval Team',
    readTime: '7 min',
    tags: ['Municipalities', 'ADA Title II', 'Compliance'],
  },
  {
    slug: 'best-ada-website-scanners-2026',
    title: 'Best ADA Website Accessibility Scanners in 2026: A Comparison for Public Entities',
    description:
      'Comparing the top WCAG/ADA website scanners — AccessEval, WAVE, axe, Siteimprove, and AudioEye. Which one is best for schools and governments?',
    date: '2026-03-12',
    author: 'AccessEval Team',
    readTime: '8 min',
    tags: ['Comparison', 'Tools', 'WCAG'],
  },
  {
    slug: 'website-accessibility-county-government',
    title: 'Website Accessibility for County Governments: A Practical Guide',
    description:
      'County websites serve thousands of residents who depend on online services. This guide covers ADA Title II requirements, common issues, and how to fix them without a big budget.',
    date: '2026-03-11',
    author: 'AccessEval Team',
    readTime: '7 min',
    tags: ['Municipalities', 'Guide', 'ADA Title II'],
  },
  {
    slug: 'ada-title-ii-school-website-deadline-2026',
    title: 'ADA Title II Website Compliance: What Schools Need to Know Before 2026',
    description:
      "The DOJ has set clear deadlines for school district website accessibility. Here's what ADA Title II means for your school website and how to prepare.",
    date: '2026-03-10',
    author: 'AccessEval Team',
    readTime: '5 min',
    tags: ['ADA Title II', 'Schools', 'Compliance'],
  },
  {
    slug: 'wcag-21-aa-checklist-schools',
    title: 'WCAG 2.1 AA Compliance Checklist for School Websites',
    description:
      'A practical, plain-English checklist of WCAG 2.1 Level AA requirements that school webmasters can follow without technical expertise.',
    date: '2026-03-05',
    author: 'AccessEval Team',
    readTime: '8 min',
    tags: ['WCAG', 'Schools', 'Checklist'],
  },
  {
    slug: 'most-common-school-website-accessibility-issues',
    title: 'The 10 Most Common Accessibility Issues on School Websites',
    description:
      'We scanned hundreds of school district websites. These are the accessibility problems we find over and over — and how to fix each one.',
    date: '2026-02-28',
    author: 'AccessEval Team',
    readTime: '7 min',
    tags: ['Schools', 'Issues', 'Fixes'],
  },
  {
    slug: 'ada-lawsuits-school-districts',
    title: 'ADA Website Lawsuits Against School Districts: What You Need to Know',
    description:
      'School districts are increasingly targeted by ADA website accessibility lawsuits. Learn about recent cases and how to protect your district.',
    date: '2026-02-20',
    author: 'AccessEval Team',
    readTime: '6 min',
    tags: ['ADA', 'Legal', 'Schools'],
  },
  {
    slug: 'free-accessibility-scan-guide',
    title: 'How to Run a Free Accessibility Scan on Your School Website',
    description:
      "Step-by-step guide to checking your school or government website for ADA compliance issues using AccessEval's free scanner.",
    date: '2026-02-15',
    author: 'AccessEval Team',
    readTime: '4 min',
    tags: ['Guide', 'Free Scan', 'Getting Started'],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
