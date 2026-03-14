import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { posts, getPost } from '../posts';

/* ------------------------------------------------------------------ */
/*  Blog post content (JSX, not markdown)                             */
/* ------------------------------------------------------------------ */

const content: Record<string, React.ReactNode> = {
  'ada-title-ii-school-website-deadline-2026': (
    <>
      <p>
        The Department of Justice has made it clear: public entities, including school districts,
        must ensure their websites are accessible to people with disabilities. Under the updated
        ADA Title II rule published in April 2024, state and local governments — and the school
        districts they oversee — face a concrete deadline of <strong>April 24, 2026</strong> to
        bring their websites and mobile apps into compliance with WCAG 2.1 Level AA.
      </p>

      <h2>What is ADA Title II?</h2>
      <p>
        Title II of the Americans with Disabilities Act prohibits discrimination by public entities.
        For decades, this applied primarily to physical spaces — wheelchair ramps, accessible
        restrooms, and signage. The 2024 rule update extends these obligations explicitly to the
        digital world, codifying what courts have been signaling for years: your website is a public
        service, and it must be usable by everyone.
      </p>

      <h2>Who does this apply to?</h2>
      <p>
        If your organization is a state or local government entity, the rule applies to you. That
        includes every K-12 public school district, county office of education, charter school
        authorized by a public entity, and municipal government. Private schools are generally
        covered under Title III, which has its own set of requirements.
      </p>

      <h2>What does compliance look like?</h2>
      <p>
        The rule requires conformance with <strong>WCAG 2.1 Level AA</strong> — a set of 50
        specific, testable success criteria covering things like color contrast, keyboard
        navigation, image alt text, form labels, and video captions. The good news is that many of
        these issues are straightforward to fix once you know where they are.
      </p>

      <h2>What should you do right now?</h2>
      <ul>
        <li>
          <strong>Run an accessibility scan</strong> to understand your current state. You can{' '}
          <a href="/">run a free scan with AccessEval</a> in under two minutes — no account
          required.
        </li>
        <li>
          <strong>Prioritize high-impact fixes</strong> like missing alt text, low contrast text,
          and unlabeled form fields. These affect the most users and are typically the easiest to
          resolve.
        </li>
        <li>
          <strong>Create an accessibility statement</strong> for your website that describes your
          commitment and provides a way for users to report barriers.
        </li>
        <li>
          <strong>Set up ongoing monitoring</strong> so new content does not re-introduce issues.
          Compliance is not a one-time project — it requires sustained attention.
        </li>
      </ul>

      <h2>The bottom line</h2>
      <p>
        April 2026 is approaching fast. Districts that start now will have ample time to identify
        issues, make fixes, and document their compliance efforts. Those that wait risk not only
        legal exposure but also the very real consequence of excluding students, parents, and
        community members from critical public information.
      </p>
      <p>
        Not sure where your district stands?{' '}
        <a href="/">Start with a free accessibility scan</a> to get a clear picture of your
        current compliance status.
      </p>
    </>
  ),

  'wcag-21-aa-checklist-schools': (
    <>
      <p>
        WCAG 2.1 Level AA is the accessibility standard that school district websites are expected
        to meet under ADA Title II. The full specification can feel overwhelming — it spans dozens
        of technical success criteria — but most of the requirements boil down to common-sense
        principles. Here is a practical checklist written for school webmasters, not developers.
      </p>

      <h2>Perceivable: Can everyone see and hear your content?</h2>
      <ul>
        <li>
          <strong>Alt text on images</strong> — Every informational image needs a text description.
          Decorative images should be marked so screen readers skip them.
        </li>
        <li>
          <strong>Video captions</strong> — All pre-recorded videos need accurate captions.
          Auto-generated captions from YouTube or Vimeo are a start but often need manual review.
        </li>
        <li>
          <strong>Color contrast</strong> — Text must have a contrast ratio of at least 4.5:1
          against its background (3:1 for large text). This especially matters for school colors
          used on websites — yellow text on white is a common culprit.
        </li>
        <li>
          <strong>Responsive text</strong> — Users need to be able to zoom to 200% without losing
          content or functionality.
        </li>
      </ul>

      <h2>Operable: Can everyone navigate your site?</h2>
      <ul>
        <li>
          <strong>Keyboard navigation</strong> — Every interactive element (links, buttons, menus,
          forms) must be reachable and usable with a keyboard alone. Try tabbing through your site
          to test this.
        </li>
        <li>
          <strong>Skip navigation links</strong> — Provide a &ldquo;Skip to main content&rdquo;
          link so keyboard users don&rsquo;t have to tab through the entire header on every page.
        </li>
        <li>
          <strong>No keyboard traps</strong> — Users should never get stuck in a component (like a
          modal or dropdown) with no way to escape using the keyboard.
        </li>
        <li>
          <strong>Enough time</strong> — If your site has auto-rotating carousels or session
          timeouts, users need the ability to pause, stop, or extend them.
        </li>
      </ul>

      <h2>Understandable: Is your content clear?</h2>
      <ul>
        <li>
          <strong>Page language</strong> — Set the language attribute on your HTML so assistive
          technology can pronounce words correctly.
        </li>
        <li>
          <strong>Form error messages</strong> — When a user makes a mistake on a form, explain
          what went wrong and how to fix it in plain language.
        </li>
        <li>
          <strong>Consistent navigation</strong> — Keep menus in the same location and order across
          all pages.
        </li>
      </ul>

      <h2>Robust: Does your site work with assistive technology?</h2>
      <ul>
        <li>
          <strong>Valid HTML</strong> — Clean, well-structured markup helps screen readers and other
          assistive tools interpret your content correctly.
        </li>
        <li>
          <strong>ARIA labels where needed</strong> — Interactive elements that lack visible text
          labels need ARIA attributes to convey their purpose.
        </li>
        <li>
          <strong>Status messages</strong> — Notifications, alerts, and status changes need to be
          announced to screen readers without requiring a page refresh.
        </li>
      </ul>

      <h2>Getting started</h2>
      <p>
        This checklist covers the most common areas where school websites fall short. The fastest
        way to see where you stand is to{' '}
        <a href="/">run a free accessibility scan</a> — you will get a letter grade and a
        plain-English breakdown of every issue found. From there, you can work through fixes
        methodically or <a href="/signup">create an account</a> to track your progress over time.
      </p>
    </>
  ),

  'most-common-school-website-accessibility-issues': (
    <>
      <p>
        After scanning hundreds of school district websites, we have seen the same accessibility
        issues come up again and again. The good news is that most of them are straightforward to
        fix. Here are the ten most common problems — and what to do about each one.
      </p>

      <h2>1. Missing image alt text</h2>
      <p>
        This is the single most common issue. When images lack alt text, screen reader users have
        no idea what the image shows. The fix is simple: add a short, descriptive{' '}
        <strong>alt</strong> attribute to every informational image. For decorative images, use an
        empty alt attribute (<strong>alt=&quot;&quot;</strong>) so screen readers skip them.
      </p>

      <h2>2. Low color contrast</h2>
      <p>
        School brand colors often look great on printed materials but fail contrast requirements on
        screens. Light gray text on white backgrounds, or colored text on colored backgrounds, can
        be unreadable for users with low vision. Use a contrast checker and aim for at least a
        4.5:1 ratio.
      </p>

      <h2>3. Missing form labels</h2>
      <p>
        Search boxes, contact forms, and newsletter sign-ups often lack proper{' '}
        <strong>&lt;label&gt;</strong> elements. Without them, screen reader users cannot tell
        which field they are filling in. Every input needs a visible or programmatically associated
        label.
      </p>

      <h2>4. Empty links and buttons</h2>
      <p>
        Social media icons, image-only links, and icon buttons frequently have no accessible name.
        Add <strong>aria-label</strong> attributes or visually hidden text so assistive technology
        can announce the link purpose.
      </p>

      <h2>5. Missing page language</h2>
      <p>
        A surprising number of school sites lack the <strong>lang</strong> attribute on the HTML
        element. Without it, screen readers may mispronounce content. This is a one-line fix in
        your template.
      </p>

      <h2>6. Inaccessible PDFs</h2>
      <p>
        School districts rely heavily on PDFs for handbooks, forms, and meeting minutes. Most are
        scanned images or lack proper tagging, making them completely inaccessible to screen
        readers. Re-create critical PDFs from source documents with proper heading structure and
        tags.
      </p>

      <h2>7. Missing skip navigation</h2>
      <p>
        Without a &ldquo;Skip to content&rdquo; link, keyboard users must tab through every
        navigation link on every page load. Adding a skip link takes just a few lines of code and
        dramatically improves the experience.
      </p>

      <h2>8. Auto-playing content</h2>
      <p>
        Homepage carousels and auto-playing videos can be disorienting for users with cognitive or
        attention-related disabilities. If you use a carousel, add pause controls. Better yet,
        consider replacing it with static content.
      </p>

      <h2>9. Missing heading structure</h2>
      <p>
        Pages that jump from H1 to H4, or use headings purely for visual styling, break the
        document outline that screen reader users depend on. Use headings in proper sequential
        order to create a logical content hierarchy.
      </p>

      <h2>10. Keyboard-inaccessible menus</h2>
      <p>
        Dropdown navigation menus that only open on hover are unusable with a keyboard. Ensure
        menus can be opened, navigated, and closed with keyboard controls alone.
      </p>

      <h2>What to do next</h2>
      <p>
        These ten issues account for the majority of accessibility barriers on school websites.
        The first step is finding out which ones affect your site.{' '}
        <a href="/">Run a free scan with AccessEval</a> and you will get a detailed report in
        under two minutes. For districts that want to track fixes and maintain compliance,{' '}
        <a href="/signup">our paid plans</a> include ongoing monitoring and progress dashboards.
      </p>
    </>
  ),

  'ada-lawsuits-school-districts': (
    <>
      <p>
        ADA website accessibility lawsuits against school districts are increasing. What was once
        a concern primarily for e-commerce companies and large corporations has become a real legal
        risk for public education. Understanding this landscape can help your district take
        proactive steps before a complaint arrives.
      </p>

      <h2>The legal landscape</h2>
      <p>
        The Americans with Disabilities Act has applied to public entities since 1990, but its
        application to websites has been clarified over the past several years through Department
        of Justice guidance and court rulings. The 2024 Title II rule update removed any remaining
        ambiguity: public entity websites must conform to WCAG 2.1 Level AA by April 2026.
      </p>
      <p>
        Even before this rule, the DOJ had entered into settlement agreements with school districts
        and universities over inaccessible digital content. The Office for Civil Rights (OCR)
        within the Department of Education has also investigated complaints under Section 504 of
        the Rehabilitation Act, which carries similar obligations.
      </p>

      <h2>What triggers a complaint?</h2>
      <p>
        Most complaints originate from one of two sources: an individual with a disability who
        encounters a barrier on your website, or an advocacy organization that systematically
        tests public entity websites for compliance. Common triggers include:
      </p>
      <ul>
        <li>A parent who uses a screen reader and cannot access their child&rsquo;s grades or school calendar</li>
        <li>A community member who cannot read a public meeting agenda posted as a scanned PDF</li>
        <li>An applicant who cannot complete an online job application</li>
        <li>Enrollment or registration forms that are not keyboard-accessible</li>
      </ul>

      <h2>What are the consequences?</h2>
      <p>
        When the DOJ or OCR gets involved, the typical outcome is a resolution agreement that
        requires the district to remediate its website within a set timeframe, often 18 to 24
        months. This usually includes hiring an accessibility consultant, conducting regular
        audits, and filing progress reports. The direct costs can range from tens of thousands to
        hundreds of thousands of dollars, and that does not include staff time or legal fees.
      </p>
      <p>
        Private lawsuits can also result in attorneys&rsquo; fees being awarded to the plaintiff
        under the ADA, which creates a financial incentive for litigation even when monetary damages
        are not available.
      </p>

      <h2>How to protect your district</h2>
      <ul>
        <li>
          <strong>Know where you stand</strong> —{' '}
          <a href="/">Run a free accessibility scan</a> to identify existing issues before someone
          else does.
        </li>
        <li>
          <strong>Document your efforts</strong> — Courts and regulators look favorably on
          organizations that demonstrate a good-faith commitment to accessibility, even if the
          website is not yet perfect.
        </li>
        <li>
          <strong>Publish an accessibility statement</strong> — Include contact information for
          reporting barriers. This gives users an alternative before they file a formal complaint.
        </li>
        <li>
          <strong>Establish ongoing monitoring</strong> — A one-time audit is not sufficient.
          Websites change constantly, and new content can introduce new issues.{' '}
          <a href="/signup">AccessEval&rsquo;s monitoring plans</a> automate this process.
        </li>
      </ul>

      <h2>Take action early</h2>
      <p>
        The most effective protection against an ADA complaint is genuine, documented progress
        toward accessibility. Districts that start addressing issues now will be in a far stronger
        position — both legally and ethically — than those that wait for a complaint to force
        their hand.
      </p>
    </>
  ),

  'free-accessibility-scan-guide': (
    <>
      <p>
        Wondering whether your school or government website meets ADA accessibility requirements?
        The fastest way to find out is to run an automated scan. AccessEval&rsquo;s free scanner
        checks your site against WCAG 2.1 Level AA standards and delivers a plain-English report
        in under two minutes. Here is how to use it.
      </p>

      <h2>Step 1: Go to the AccessEval homepage</h2>
      <p>
        Visit <a href="/">accesseval.com</a> and you will see a URL input field right on the
        homepage. No account creation, no credit card, no setup required.
      </p>

      <h2>Step 2: Enter your website URL</h2>
      <p>
        Type or paste the full URL of the page you want to scan — for example,{' '}
        <strong>https://www.yourschool.edu</strong>. The free scan checks a single page at a time,
        so start with your homepage since it typically contains your navigation, header, footer,
        and most common design patterns.
      </p>

      <h2>Step 3: Wait for your results</h2>
      <p>
        AccessEval uses Playwright (a real browser) and axe-core (the industry standard
        accessibility testing engine) to crawl your page. The scan usually completes in 30 to 90
        seconds. You will see a progress indicator while it runs.
      </p>

      <h2>Step 4: Review your report</h2>
      <p>
        Your results include:
      </p>
      <ul>
        <li>
          <strong>A letter grade (A through F)</strong> that gives you an instant sense of where
          you stand
        </li>
        <li>
          <strong>Issue counts by severity</strong> — critical, serious, moderate, and minor
        </li>
        <li>
          <strong>Plain-English descriptions</strong> of each issue, written for non-technical
          readers
        </li>
        <li>
          <strong>Specific locations</strong> on the page where each issue was found
        </li>
      </ul>

      <h2>Step 5: Decide on next steps</h2>
      <p>
        A single-page scan is a great starting point, but most school websites have dozens or
        hundreds of pages. Common next steps include:
      </p>
      <ul>
        <li>
          Sharing the report with your IT team or web vendor to start addressing critical issues
        </li>
        <li>
          Scanning additional pages — your calendar, staff directory, and enrollment forms are
          good candidates
        </li>
        <li>
          <a href="/signup">Creating an AccessEval account</a> to scan your full site, track
          fixes over time, and generate compliance documentation
        </li>
      </ul>

      <h2>What automated scans can and cannot do</h2>
      <p>
        Automated tools like AccessEval can detect roughly 30 to 50 percent of all possible
        accessibility barriers. They are excellent at catching structural issues like missing alt
        text, low contrast, missing labels, and heading order problems. However, some aspects of
        accessibility — like whether alt text is actually meaningful, or whether the tab order
        makes logical sense — require human judgment.
      </p>
      <p>
        That said, an automated scan is the best first step. The issues it finds are real, and
        fixing them will meaningfully improve your site&rsquo;s accessibility for users with
        disabilities.
      </p>
      <p>
        Ready to see where your site stands?{' '}
        <a href="/">Run your free scan now</a> — it takes less than two minutes.
      </p>
    </>
  ),
};

/* ------------------------------------------------------------------ */
/*  Static params (for build-time generation)                         */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

/* ------------------------------------------------------------------ */
/*  Dynamic SEO metadata                                              */
/* ------------------------------------------------------------------ */

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} — AccessEval Blog`,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || !content[slug]) notFound();

  const formattedDate = new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            author: {
              '@type': 'Organization',
              name: post.author,
            },
          }),
        }}
      />

      <article className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-body text-sm text-slate-400 hover:text-emerald-600 transition-colors mb-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            All posts
          </Link>

          {/* Header */}
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-xs font-body font-medium text-emerald-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-display text-display-lg text-ink mb-4">{post.title}</h1>

            <div className="flex items-center gap-3 font-body text-sm text-slate-400">
              <span>{post.author}</span>
              <span aria-hidden="true">&middot;</span>
              <time dateTime={post.date}>{formattedDate}</time>
              <span aria-hidden="true">&middot;</span>
              <span>{post.readTime} read</span>
            </div>
          </header>

          {/* Content */}
          <div
            className={[
              '[&_h2]:font-display [&_h2]:text-display-sm [&_h2]:text-ink [&_h2]:mt-8 [&_h2]:mb-3',
              '[&_p]:font-body [&_p]:text-slate-700 [&_p]:leading-relaxed [&_p]:mb-4',
              '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2',
              '[&_li]:font-body [&_li]:text-slate-700',
              '[&_a]:text-emerald-600 [&_a]:underline hover:[&_a]:text-emerald-700',
              '[&_strong]:font-semibold [&_strong]:text-ink',
            ].join(' ')}
          >
            {content[slug]}
          </div>

          {/* CTA */}
          <div className="mt-14 pt-10 border-t border-slate-200">
            <div className="card p-8 text-center bg-emerald-50/50 border-emerald-200/60">
              <h2 className="font-display text-display-sm text-ink mb-2">
                Check your website&rsquo;s accessibility
              </h2>
              <p className="font-body text-slate-500 mb-6 max-w-md mx-auto">
                Run a free scan and get a plain-English report of every accessibility issue — no
                account required.
              </p>
              <a href="/" className="btn-primary inline-flex">
                Run a free scan
              </a>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
