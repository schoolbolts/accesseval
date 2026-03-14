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
