import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { posts, getPost } from '../posts';

/* ------------------------------------------------------------------ */
/*  Blog post content (JSX, not markdown)                             */
/* ------------------------------------------------------------------ */

const content: Record<string, React.ReactNode> = {
  'accesseval-vs-wave-school-government-websites': (
    <>
      <p>
        If you work in a school district or local government and have searched for accessibility
        testing tools, you have almost certainly come across <strong>WAVE</strong> (the Web
        Accessibility Evaluation Tool). Built by WebAIM, it is one of the most widely used free
        accessibility checkers available. So how does it compare to AccessEval, and which one
        should public entities use?
      </p>

      <h2>What WAVE does well</h2>
      <p>
        WAVE is a free browser extension and web service that overlays accessibility errors,
        alerts, and structural elements directly on your page. You enter a URL (or use the browser
        extension), and WAVE highlights issues like missing alt text, low contrast, empty links,
        and heading structure problems. It is an excellent tool for a quick manual check of a
        single page.
      </p>
      <p>
        The price — free — is hard to beat, and it is trusted by accessibility professionals
        worldwide. For a developer or webmaster reviewing a specific page, WAVE is a solid
        first-line tool.
      </p>

      <h2>Where WAVE falls short for public entities</h2>
      <p>
        The challenge is that WAVE was designed for developers and accessibility specialists, not
        for the school administrator or city clerk who needs to understand and act on the results.
        Here is where public entities run into problems:
      </p>
      <ul>
        <li><strong>One page at a time</strong> — WAVE scans a single URL. If your school website
        has 200 pages, you need to manually scan each one. There is no way to crawl your full
        site automatically.</li>
        <li><strong>No ongoing monitoring</strong> — WAVE gives you a snapshot. It does not track
        whether issues have been fixed, alert you when new issues appear, or maintain a history of
        your compliance status over time.</li>
        <li><strong>Technical output</strong> — The results use WCAG success criteria labels and
        developer-oriented language. A non-technical user may not know what &ldquo;ARIA label
        missing&rdquo; means or how to fix it in their CMS.</li>
        <li><strong>No compliance documentation</strong> — WAVE does not generate accessibility
        statements, compliance reports, or any documentation you can share with your board or
        legal counsel.</li>
        <li><strong>No fix guidance</strong> — It tells you what is wrong but not how to fix it
        in your specific CMS (WordPress, Finalsite, Squarespace, etc.).</li>
      </ul>

      <h2>What AccessEval adds</h2>
      <p>
        AccessEval uses the same underlying engine (axe-core) that powers many professional
        accessibility tools, but wraps it in a workflow designed for schools and governments:
      </p>
      <ul>
        <li><strong>Full-site crawling</strong> — Enter your root URL and AccessEval crawls up to
        100, 500, or 2,000 pages depending on your plan. No manual page-by-page scanning.</li>
        <li><strong>Plain-English reports</strong> — Every issue is translated from technical WCAG
        jargon into language a school webmaster can understand and act on.</li>
        <li><strong>Ongoing monitoring</strong> — Weekly or monthly automated scans track your
        compliance status over time. You can see if you are improving or if new issues have been
        introduced.</li>
        <li><strong>Compliance documentation</strong> — Generate accessibility statements and PDF
        reports you can share with your school board, city council, or legal team.</li>
        <li><strong>CMS-specific fix instructions</strong> — On the Fix plan, you get step-by-step
        remediation guidance tailored to your content management system.</li>
      </ul>

      <h2>Should you use both?</h2>
      <p>
        Yes. WAVE is a great tool for spot-checking individual pages during content creation or
        after making changes. AccessEval is the system of record for your overall compliance
        status — it monitors your full site, tracks progress, and generates the documentation
        you need to demonstrate compliance.
      </p>
      <p>
        Think of WAVE as a spell-checker you run on a single document, and AccessEval as the
        ongoing quality assurance system for your entire website.
      </p>

      <h2>Pricing comparison</h2>
      <ul>
        <li><strong>WAVE:</strong> Free (browser extension and single-page web tool). WAVE also
        offers a paid API for developers who want to integrate scanning into their build process.</li>
        <li><strong>AccessEval:</strong> $99/year for monthly scans of up to 100 pages, $299/year
        for weekly scans of 500 pages with compliance docs, $599/year for 2,000 pages with
        CMS-specific guidance.</li>
      </ul>

      <h2>The bottom line</h2>
      <p>
        WAVE is an excellent free tool for manual, one-off page checks. But if your school or
        government needs to demonstrate ADA Title II compliance across your full website —
        with ongoing monitoring, plain-English reports, and documentation — AccessEval fills the
        gaps that WAVE leaves open. <a href="/">Run a free scan</a> to see the difference.
      </p>
    </>
  ),

  'accesseval-vs-siteimprove-public-entities': (
    <>
      <p>
        <strong>Siteimprove</strong> is one of the most well-known names in web accessibility and
        content quality. It is used by large universities, state agencies, and enterprise
        organizations worldwide. If you are evaluating accessibility tools for a school district
        or local government, you may be wondering how it compares to AccessEval.
      </p>

      <h2>What Siteimprove offers</h2>
      <p>
        Siteimprove is a comprehensive digital governance platform that goes well beyond
        accessibility. It includes content quality auditing, SEO analysis, analytics, data
        privacy scanning, and brand consistency checking — alongside its accessibility module.
        The accessibility scanner tests against WCAG standards and provides detailed issue
        tracking with prioritization.
      </p>
      <p>
        For large organizations with dedicated web teams, compliance officers, and substantial
        budgets, Siteimprove is a powerful platform. The accessibility module includes automated
        scanning, assisted manual testing workflows, and integration with content management
        systems.
      </p>

      <h2>The challenge for schools and small governments</h2>
      <p>
        Siteimprove is enterprise software with enterprise pricing. While exact pricing is not
        published (it requires a sales conversation), contracts typically start at{' '}
        <strong>$5,000 to $15,000 per year</strong> and can go much higher depending on the
        number of pages and modules selected. For a K-12 school district with 200 pages or a
        small city with a modest website, this is difficult to justify.
      </p>
      <p>
        Beyond cost, the platform&rsquo;s depth can be a disadvantage for smaller organizations.
        Siteimprove is designed for teams with dedicated web and accessibility staff. A school
        webmaster who also handles parent communications, the staff directory, and the lunch menu
        does not need an enterprise governance platform — they need clear answers about what is
        wrong and how to fix it.
      </p>

      <h2>How AccessEval compares</h2>
      <p>
        AccessEval focuses specifically on what schools and local governments need for ADA Title II
        compliance:
      </p>
      <ul>
        <li><strong>Affordable pricing</strong> — $99 to $599 per year versus $5,000+ for
        Siteimprove. AccessEval is designed to fit within a line-item budget without requiring
        board approval or a procurement process.</li>
        <li><strong>Plain-English reports</strong> — Where Siteimprove provides detailed technical
        dashboards for web professionals, AccessEval translates every issue into language a
        non-technical administrator can understand and act on.</li>
        <li><strong>Same scanning engine</strong> — Both tools use industry-standard WCAG testing
        methodologies. AccessEval scans with Playwright and axe-core, the same engine used by
        major enterprise platforms.</li>
        <li><strong>Compliance documentation</strong> — AccessEval generates accessibility
        statements and PDF reports specifically designed for school boards and city councils.</li>
        <li><strong>No sales process</strong> — Sign up, enter your URL, and start scanning.
        No demos, no procurement, no annual contract negotiations.</li>
      </ul>

      <h2>What you give up</h2>
      <p>
        AccessEval does not offer SEO auditing, analytics, content quality scoring, or data
        privacy scanning. It does not have assisted manual testing workflows or advanced
        role-based access for large teams. If your organization has 10,000+ pages, a dedicated
        web team, and needs a full digital governance suite, Siteimprove may be worth the
        investment.
      </p>
      <p>
        But if your primary goal is meeting ADA Title II requirements on a public entity budget,
        AccessEval delivers the core accessibility scanning and compliance documentation you need
        at a fraction of the cost.
      </p>

      <h2>Quick comparison</h2>
      <ul>
        <li><strong>Siteimprove:</strong> $5,000–$15,000+/yr. Full governance platform. Enterprise
        onboarding. Best for large organizations with dedicated web teams.</li>
        <li><strong>AccessEval:</strong> $99–$599/yr. Focused accessibility scanning. Self-serve
        signup. Built for schools and small governments.</li>
      </ul>

      <h2>The bottom line</h2>
      <p>
        Siteimprove is a serious platform for serious budgets. For the majority of school districts
        and municipalities — especially those under 50,000 people with the April 2027 deadline
        approaching — AccessEval provides the same core scanning capability at 90% less cost,
        with reports designed for the people who actually need to read them.{' '}
        <a href="/">Try a free scan</a> to see what you get.
      </p>
    </>
  ),

  'accesseval-vs-userway-overlay-widgets': (
    <>
      <p>
        <strong>UserWay</strong> is one of the most visible accessibility companies on the web. If
        you have seen a small wheelchair icon in the corner of a website that opens a panel with
        font size adjustments, contrast toggles, and screen reader options — that is likely a
        UserWay widget (or one of its competitors like accessiBe or EqualWeb). These are called
        accessibility overlays.
      </p>
      <p>
        Many school districts and municipalities have adopted overlay widgets because they are
        easy to install and appear to solve the compliance problem quickly. But there is a
        fundamental difference between what overlays do and what ADA Title II actually requires.
      </p>

      <h2>What UserWay does</h2>
      <p>
        UserWay provides a JavaScript widget that sits on top of your website and offers users
        adjustable settings — larger text, higher contrast, dyslexia-friendly fonts, keyboard
        navigation aids, and more. Some plans also include AI-powered remediation that attempts to
        fix underlying code issues automatically (for example, generating alt text for images or
        adding ARIA labels).
      </p>
      <p>
        The appeal is obvious: install one script tag and get instant accessibility improvements
        without changing your website code. Pricing for the remediation product (UserWay&rsquo;s
        &ldquo;AI-Powered Accessibility&rdquo;) typically starts around $490 per month for small
        sites, though pricing varies.
      </p>

      <h2>Why overlays are not enough for ADA compliance</h2>
      <p>
        The accessibility community — including the leading disability rights organizations — has
        been vocal about the limitations of overlay widgets. Here is why:
      </p>
      <ul>
        <li><strong>They do not fix the source code</strong> — Overlays attempt to patch
        accessibility issues at runtime using JavaScript. If the overlay fails to load, encounters
        a conflict, or if a user has JavaScript disabled, the underlying accessibility barriers
        remain.</li>
        <li><strong>Screen reader users often disable them</strong> — Many users who rely on
        assistive technology already have their preferred settings configured. An overlay that
        changes page behavior can actually interfere with their tools.</li>
        <li><strong>They cannot fix structural problems</strong> — Issues like missing form labels,
        broken heading hierarchy, inaccessible PDFs, and keyboard traps in third-party widgets
        cannot be reliably fixed by a JavaScript overlay.</li>
        <li><strong>They do not satisfy legal requirements</strong> — Multiple court cases and DOJ
        settlement agreements have found that overlay widgets alone do not constitute ADA
        compliance. The DOJ&rsquo;s Title II rule specifically requires conformance with WCAG 2.1
        Level AA — not the presence of a remediation widget.</li>
        <li><strong>They have been named in lawsuits</strong> — Companies using overlay products
        have been sued specifically because the overlay failed to make the site accessible.
        Having an overlay installed does not provide legal protection.</li>
      </ul>

      <h2>How AccessEval approaches the problem differently</h2>
      <p>
        AccessEval does not add a widget to your site. Instead, it scans your actual website code
        to identify specific WCAG 2.1 AA violations, then tells you exactly what needs to be
        fixed and how:
      </p>
      <ul>
        <li><strong>Real scanning, real issues</strong> — AccessEval crawls your site with Playwright
        and tests every page with axe-core. You get a list of actual code-level issues, not a
        cosmetic layer on top of broken code.</li>
        <li><strong>Fix the source</strong> — Reports include plain-English descriptions of each
        issue and, on the Fix plan, CMS-specific instructions for how to resolve them in
        WordPress, Finalsite, Squarespace, and other platforms.</li>
        <li><strong>Documentation that holds up</strong> — AccessEval generates accessibility
        statements and compliance reports based on your actual scan results — evidence that you
        are actively working toward compliance, not just installing a widget.</li>
        <li><strong>Ongoing monitoring</strong> — Weekly or monthly automated scans catch new
        issues as your site content changes, rather than relying on a JavaScript layer to mask
        them.</li>
      </ul>

      <h2>What about AI-generated fixes?</h2>
      <p>
        UserWay&rsquo;s AI remediation can help with some issues — automatically generating alt
        text, for example. But AI-generated alt text is often generic or inaccurate, and relying
        on automated fixes for critical accessibility issues creates risk. The DOJ expects
        organizations to actually fix their web content, not to rely on third-party tools that
        may or may not work correctly for every user.
      </p>

      <h2>Pricing comparison</h2>
      <ul>
        <li><strong>UserWay Widget (free tier):</strong> Basic toolbar with user-side adjustments.
        Does not fix code issues.</li>
        <li><strong>UserWay AI Remediation:</strong> Approximately $490+/month ($5,880+/year) for
        automated code fixes. Effectiveness varies.</li>
        <li><strong>AccessEval:</strong> $99 to $599/year. Identifies real issues, provides fix
        guidance, generates compliance documentation.</li>
      </ul>

      <h2>The bottom line</h2>
      <p>
        Overlay widgets are appealing because they promise a quick fix. But ADA Title II requires
        your website to actually conform to WCAG 2.1 Level AA — not to have a JavaScript widget
        attempting to paper over the issues. For school districts and municipalities facing
        compliance deadlines (April 2026 for 50,000+ populations, April 2027 for smaller
        entities), the path to real compliance starts with understanding what is actually wrong
        with your site.
      </p>
      <p>
        <a href="/">Run a free AccessEval scan</a> to see the real accessibility issues on your
        website — and get a clear roadmap for fixing them.
      </p>
    </>
  ),

  'accesseval-vs-audioeye-school-districts': (
    <>
      <p>
        If you are a K-12 school district trying to meet the ADA Title II website accessibility
        deadline, you have probably come across both AccessEval and AudioEye. They solve the same
        core problem — helping you find and fix WCAG 2.1 AA issues on your website — but they
        take very different approaches, at very different price points.
      </p>

      <h2>The short version</h2>
      <p>
        <strong>AccessEval</strong> is built specifically for schools and small government entities.
        It scans your site with the same industry-standard engine (axe-core) used by enterprise tools,
        produces plain-English reports, and costs $99 to $599 per year depending on the number of
        pages you need to monitor. There are no per-page fees, no contracts, and no upsells.
      </p>
      <p>
        <strong>AudioEye</strong> is an enterprise accessibility platform that combines automated
        scanning with AI-powered remediation overlays and manual auditing. Pricing typically starts
        at several thousand dollars per year and scales based on traffic and pages.
      </p>

      <h2>Scanning and detection</h2>
      <p>
        Both tools use automated scanning to identify WCAG violations. AccessEval uses Playwright
        (a real browser) combined with axe-core, which is the same engine that powers most
        accessibility testing tools including Deque&rsquo;s own products. AudioEye uses proprietary
        scanning technology and adds a JavaScript overlay that attempts to fix certain issues
        in real time.
      </p>
      <p>
        The overlay approach is controversial in the accessibility community. Organizations like
        the National Federation of the Blind have raised concerns about overlay tools, and some
        users with disabilities report that overlays can actually interfere with their assistive
        technology. AccessEval takes a different approach: it tells you exactly what is wrong and
        gives you step-by-step instructions to fix the underlying code, rather than papering over
        issues with client-side JavaScript.
      </p>

      <h2>Reporting</h2>
      <p>
        AccessEval produces a letter grade (A through F) and translates every axe-core rule violation
        into plain English that a non-technical administrator can understand. Reports include the
        exact location of each issue on the page and, on higher-tier plans, CMS-specific fix
        instructions for platforms like WordPress, Finalsite, and Squarespace.
      </p>
      <p>
        AudioEye provides more detailed enterprise reporting with dashboards, compliance scoring,
        and VPAT documentation. If your district needs to respond to a formal audit or produce
        detailed compliance documentation for a vendor, AudioEye&rsquo;s reporting may be more
        comprehensive — but for most small to mid-size districts, AccessEval&rsquo;s reports provide
        everything needed to identify, prioritize, and resolve issues.
      </p>

      <h2>Pricing</h2>
      <p>
        This is where the tools diverge most. AccessEval&rsquo;s pricing is public and simple:
      </p>
      <ul>
        <li><strong>Scan</strong> — $99/year (100 pages, monthly scans)</li>
        <li><strong>Comply</strong> — $299/year (500 pages, weekly scans, compliance docs)</li>
        <li><strong>Fix</strong> — $599/year (2,000 pages, CMS-specific instructions, vendor reports)</li>
      </ul>
      <p>
        AudioEye&rsquo;s pricing is not publicly listed and typically requires a sales call. Based on
        public procurement records and published case studies, contracts generally start between
        $3,000 and $10,000 per year for a single site, with enterprise pricing going significantly
        higher.
      </p>
      <p>
        For a district with a limited technology budget, the difference is significant. AccessEval&rsquo;s
        most comprehensive plan costs less than AudioEye&rsquo;s entry-level offering in most cases.
      </p>

      <h2>Who should use what?</h2>
      <p>
        <strong>Choose AccessEval if:</strong> You are a small to mid-size school district that needs
        straightforward scanning, clear reports, and affordable ongoing monitoring. You want to
        understand and fix your actual code rather than rely on an overlay. Your budget is under
        $1,000 per year.
      </p>
      <p>
        <strong>Choose AudioEye if:</strong> You are a large district or state-level organization that
        needs enterprise-grade compliance documentation, managed remediation services, and has budget
        for a multi-thousand-dollar annual contract. You want a vendor to actively manage fixes
        rather than doing it in-house.
      </p>

      <h2>Try it yourself</h2>
      <p>
        The best way to evaluate is to see the results. <a href="/">Run a free scan of your district
        website with AccessEval</a> — no signup required, results in under two minutes. Compare what
        you get against any other tool you are evaluating.
      </p>
    </>
  ),

  'ada-compliance-small-towns-municipalities': (
    <>
      <p>
        If you work for a city, town, or county with a population under 50,000, the federal
        government has given you until <strong>April 26, 2027</strong> to make your website
        accessible under ADA Title II. (Entities serving 50,000 or more people face an earlier
        deadline of April 24, 2026.) This is not optional — it is a federal civil rights
        requirement, and non-compliance creates real legal exposure.
      </p>
      <p>
        The good news: for most small municipalities, achieving compliance is more affordable and
        straightforward than you might think.
      </p>

      <h2>What the law actually requires</h2>
      <p>
        The DOJ&rsquo;s 2024 Title II rule requires all state and local government web content to
        meet <strong>WCAG 2.1 Level AA</strong>. This is a specific, testable technical standard
        with about 50 success criteria covering things like:
      </p>
      <ul>
        <li>Text alternatives for images (alt text)</li>
        <li>Sufficient color contrast (4.5:1 ratio for normal text)</li>
        <li>Keyboard navigability for all interactive elements</li>
        <li>Form labels and error messages</li>
        <li>Proper heading structure</li>
        <li>Accessible PDF documents</li>
      </ul>
      <p>
        The deadline is tiered by population. Entities serving 50,000 or more people must comply
        by <strong>April 24, 2026</strong>. Entities under 50,000 — which includes most towns, small cities,
        county governments, and special districts — have until <strong>April 26, 2027</strong>.
      </p>

      <h2>What is actually on your website?</h2>
      <p>
        Most small municipality websites include a core set of content that residents depend on:
      </p>
      <ul>
        <li>Meeting agendas and minutes (often posted as PDFs)</li>
        <li>Utility billing and payment portals</li>
        <li>Permit and license applications</li>
        <li>Parks and recreation registration</li>
        <li>Contact information and department directories</li>
        <li>Public notices and emergency alerts</li>
      </ul>
      <p>
        Every one of these must be accessible. If a resident who uses a screen reader cannot pay
        their water bill online, or cannot read a public meeting agenda, that is a Title II
        violation.
      </p>

      <h2>Common issues we see on municipal websites</h2>
      <p>
        After scanning government websites, the most frequent problems are:
      </p>
      <ul>
        <li><strong>Scanned PDF documents</strong> — Meeting minutes and ordinances scanned as images
        are completely invisible to screen readers. These need to be recreated as tagged PDFs or
        HTML pages.</li>
        <li><strong>Missing form labels</strong> — Online forms for permits, complaints, and payments
        often lack proper labels, making them unusable with assistive technology.</li>
        <li><strong>Poor color contrast</strong> — Municipal branding often includes colors that
        do not meet the 4.5:1 contrast ratio, especially in headers and navigation.</li>
        <li><strong>Inaccessible embedded content</strong> — Third-party widgets for payments, GIS
        maps, and calendars are often not accessible, and the municipality is still responsible.</li>
      </ul>

      <h2>How to get compliant on a small budget</h2>
      <p>
        Enterprise accessibility vendors typically charge $5,000 to $25,000 or more per year.
        That is out of reach for most towns with small IT budgets. Here is a more practical path:
      </p>
      <ul>
        <li>
          <strong>Start with a scan</strong> — <a href="/">Run a free scan with AccessEval</a> to
          get a baseline. You will see exactly which issues exist and how severe they are.
        </li>
        <li>
          <strong>Fix the critical issues first</strong> — Missing alt text, unlabeled forms, and
          keyboard traps are the highest-priority items. Most can be fixed by your web vendor or
          CMS administrator in a few hours.
        </li>
        <li>
          <strong>Address PDFs</strong> — Identify your most-accessed PDF documents and either
          recreate them as HTML pages or re-export them with proper tagging from the source
          document.
        </li>
        <li>
          <strong>Set up monitoring</strong> — New content can reintroduce issues. An{' '}
          <a href="/signup?plan=scan">AccessEval Scan plan at $99/year</a> gives you monthly
          automated checks so you do not backslide.
        </li>
        <li>
          <strong>Publish an accessibility statement</strong> — This demonstrates good faith and
          gives residents a way to report barriers before they file a formal complaint.
        </li>
      </ul>

      <h2>The risk of doing nothing</h2>
      <p>
        ADA complaints against municipalities are increasing. The DOJ has entered into resolution
        agreements with cities and counties across the country, requiring costly remediation on
        compressed timelines. Private lawsuits under the ADA can also result in attorney fee awards.
        The cost of a complaint — $50,000 to $300,000 including legal fees and remediation — dwarfs
        the cost of proactive compliance.
      </p>

      <h2>Take the first step</h2>
      <p>
        You can find out where your municipality stands in under two minutes.{' '}
        <a href="/">Run a free accessibility scan</a> and get a plain-English report of every
        issue on your website. No account required.
      </p>
    </>
  ),

  'best-ada-website-scanners-2026': (
    <>
      <p>
        With ADA Title II compliance deadlines approaching — April 2026 for larger entities, April 2027 for smaller ones — school districts,
        cities, and counties need to choose a website accessibility scanner. There are dozens of
        options ranging from free browser extensions to enterprise platforms costing tens of
        thousands of dollars. Here is how the most common tools compare for public entities.
      </p>

      <h2>What to look for in a scanner</h2>
      <p>
        Before comparing specific tools, here is what matters most for schools and governments:
      </p>
      <ul>
        <li><strong>WCAG 2.1 AA coverage</strong> — The DOJ requires conformance with this specific
        standard. Your scanner needs to test against it.</li>
        <li><strong>Plain-English reporting</strong> — Technical axe-core output is useful for
        developers but not for the administrator or superintendent who needs to understand the
        results.</li>
        <li><strong>Ongoing monitoring</strong> — A one-time scan is not enough. Websites change
        constantly, and new content introduces new issues.</li>
        <li><strong>Affordable pricing</strong> — Public entities have limited budgets. A tool that
        costs more than the remediation itself is not practical.</li>
      </ul>

      <h2>AccessEval</h2>
      <p>
        <strong>Best for:</strong> K-12 districts, small cities, counties, and special districts
        with limited budgets.
      </p>
      <p>
        AccessEval is purpose-built for schools and local governments. It scans with Playwright and
        axe-core, translates every issue into plain English, and provides CMS-specific fix
        instructions for platforms like WordPress, Finalsite, and Squarespace. Pricing is simple
        and public: $99/year for monthly scans of up to 100 pages, $299/year for weekly scans of
        500 pages with compliance documentation, and $599/year for 2,000 pages with CMS-specific
        guidance and vendor-shareable reports.
      </p>
      <p>
        <strong>Strengths:</strong> Purpose-built for public entities, plain-English reports,
        affordable pricing, accessibility statement generator, free scan with no signup.
      </p>
      <p>
        <strong>Limitations:</strong> No JavaScript overlay remediation, no managed services.
      </p>
      <p>
        <a href="/">Try it free</a> — no account required.
      </p>

      <h2>WAVE (WebAIM)</h2>
      <p>
        <strong>Best for:</strong> Quick, one-off manual checks of individual pages.
      </p>
      <p>
        WAVE is a free browser extension from WebAIM that overlays accessibility errors directly on
        the page. It is excellent for developers who want to visually inspect a single page. However,
        it does not crawl your site, does not provide ongoing monitoring, and does not generate
        reports suitable for stakeholders. For a district with hundreds of pages, manually checking
        each one with WAVE is impractical.
      </p>
      <p>
        <strong>Strengths:</strong> Free, visual feedback, well-established, great for developers.
      </p>
      <p>
        <strong>Limitations:</strong> Manual one-page-at-a-time use, no site-wide scanning, no
        monitoring, no exportable reports.
      </p>

      <h2>axe DevTools (Deque)</h2>
      <p>
        <strong>Best for:</strong> Development teams building accessible websites from scratch.
      </p>
      <p>
        Deque&rsquo;s axe is the industry-standard accessibility testing engine — it powers many
        other tools, including AccessEval. The free axe DevTools browser extension is excellent for
        developers who can interpret technical output. Deque also offers axe Monitor for site-wide
        scanning, but enterprise pricing typically starts at several thousand dollars per year.
      </p>
      <p>
        <strong>Strengths:</strong> Industry-standard engine, highly accurate, developer-friendly.
      </p>
      <p>
        <strong>Limitations:</strong> Technical output not suitable for non-developers, enterprise
        pricing for monitoring features.
      </p>

      <h2>Siteimprove</h2>
      <p>
        <strong>Best for:</strong> Large organizations with comprehensive digital governance needs.
      </p>
      <p>
        Siteimprove is a full digital governance platform that includes accessibility, SEO, content
        quality, and analytics. It is widely used by universities and state governments. However,
        it is priced for enterprise use — annual contracts typically start at $10,000 or more.
        For a small district or municipality, the platform offers far more than needed at a price
        point that is difficult to justify.
      </p>
      <p>
        <strong>Strengths:</strong> Comprehensive platform, strong enterprise reporting, well-known
        in higher education.
      </p>
      <p>
        <strong>Limitations:</strong> Enterprise pricing, complex setup, overkill for small entities.
      </p>

      <h2>AudioEye</h2>
      <p>
        <strong>Best for:</strong> Organizations that want a vendor to manage remediation.
      </p>
      <p>
        AudioEye combines automated scanning with a JavaScript overlay that attempts to fix certain
        issues client-side. This approach is convenient but controversial — accessibility advocates
        have raised concerns about overlay tools interfering with assistive technology. Pricing is
        not public but typically starts at several thousand dollars per year.
      </p>
      <p>
        <strong>Strengths:</strong> Managed remediation, overlay fixes some issues immediately.
      </p>
      <p>
        <strong>Limitations:</strong> Overlay approach is controversial, pricing not transparent,
        does not fix underlying code.
      </p>

      <h2>Summary comparison</h2>
      <p>
        For K-12 school districts and small municipalities with limited budgets, the practical
        choice comes down to: use free tools like WAVE for spot checks, and pair them with an
        affordable monitoring tool like AccessEval for site-wide, ongoing compliance. Enterprise
        tools like Siteimprove and AudioEye make sense for large organizations with dedicated
        accessibility teams and corresponding budgets.
      </p>
      <p>
        The most important step is to start. <a href="/">Run a free scan with AccessEval</a> to
        see exactly where your website stands — it takes under two minutes, and no signup is
        required.
      </p>
    </>
  ),

  'website-accessibility-county-government': (
    <>
      <p>
        County governments provide essential services to residents — property tax payments, court
        records, public health information, election details, and emergency notifications. When a
        county website is not accessible, residents with disabilities are cut off from services
        they need and have a legal right to access.
      </p>
      <p>
        Under ADA Title II, every county government in the United States must ensure its website
        meets WCAG 2.1 Level AA standards. Counties serving 50,000+ people must comply by
        April 24, 2026; those under 50,000 have until April 26, 2027. This guide explains what
        that means in practice and how to get there without breaking the budget.
      </p>

      <h2>Why county websites are especially at risk</h2>
      <p>
        County websites tend to accumulate content over many years. Meeting minutes from 2015,
        budget documents from various departments, GIS mapping tools, permit applications —
        all of this content falls under the ADA requirement. Unlike a private business that might
        have a small marketing website, county sites often have thousands of pages and hundreds
        of PDF documents, many created by different departments with no consistent accessibility
        standards.
      </p>
      <p>
        Common risk areas include:
      </p>
      <ul>
        <li><strong>Scanned PDFs</strong> — Board minutes, ordinances, and financial documents
        scanned as images are completely inaccessible to screen readers.</li>
        <li><strong>Third-party portals</strong> — Tax payment systems, permit applications, and
        court record searches are often provided by third-party vendors. The county is still
        responsible for their accessibility.</li>
        <li><strong>Legacy CMS templates</strong> — Older website templates built before
        accessibility was a priority often have fundamental navigation and structure issues.</li>
        <li><strong>Maps and GIS tools</strong> — Interactive maps are notoriously difficult to
        make accessible. At minimum, the information conveyed by the map must be available in
        an alternative format.</li>
      </ul>

      <h2>A practical compliance roadmap</h2>

      <h2>Phase 1: Assessment (Week 1-2)</h2>
      <p>
        Start by understanding the scope of the problem. <a href="/">Run a free accessibility
        scan</a> on your county homepage to get an immediate baseline. Then identify your most
        critical pages — the ones residents use most frequently:
      </p>
      <ul>
        <li>Homepage and main navigation</li>
        <li>Property tax lookup and payment</li>
        <li>Meeting agendas and minutes</li>
        <li>Job applications</li>
        <li>Contact and department directories</li>
        <li>Emergency and public safety information</li>
      </ul>

      <h2>Phase 2: Critical fixes (Week 3-6)</h2>
      <p>
        Focus on the issues that affect the most users and carry the highest legal risk:
      </p>
      <ul>
        <li>Add alt text to all informational images</li>
        <li>Fix color contrast violations in headers, navigation, and body text</li>
        <li>Add labels to all form inputs</li>
        <li>Ensure keyboard navigation works for menus and interactive elements</li>
        <li>Add a &ldquo;Skip to main content&rdquo; link</li>
      </ul>

      <h2>Phase 3: Documents and content (Week 7-12)</h2>
      <p>
        Address your most-accessed PDF documents. For documents that get regular traffic —
        current year budgets, active ordinances, recent meeting minutes — either recreate them
        as tagged PDFs or convert them to HTML pages. For archived documents with little traffic,
        add a notice offering to provide accessible versions on request.
      </p>

      <h2>Phase 4: Ongoing monitoring</h2>
      <p>
        Accessibility is not a one-time project. New content, staff changes, and CMS updates can
        reintroduce issues. Set up automated monitoring to catch problems as they appear. An{' '}
        <a href="/signup?plan=comply">AccessEval Comply plan</a> provides weekly scans, a fix
        tracking dashboard, and an accessibility statement generator for $299/year — a fraction
        of what enterprise tools charge.
      </p>

      <h2>Communicating with your board</h2>
      <p>
        County boards and commissions need to understand this is a federal requirement, not an
        optional improvement. Key points for your presentation:
      </p>
      <ul>
        <li>ADA Title II compliance is a legal obligation, not a recommendation</li>
        <li>Non-compliance creates real liability — settlements and resolution agreements typically
        cost $50,000 to $300,000</li>
        <li>Proactive compliance can be achieved for under $600/year with the right tools</li>
        <li>Documenting your compliance efforts provides significant legal protection</li>
      </ul>

      <h2>Start today</h2>
      <p>
        The first step takes less than two minutes. <a href="/">Scan your county website for
        free</a> and get a clear picture of where you stand. From there, you can prioritize fixes,
        present a plan to your board, and begin working toward compliance well before your
        deadline hits (April 2026 for 50,000+ populations, April 2027 for smaller entities).
      </p>
    </>
  ),

  'ada-title-ii-school-website-deadline-2026': (
    <>
      <p>
        The Department of Justice has made it clear: public entities, including school districts,
        must ensure their websites are accessible to people with disabilities. Under the updated
        ADA Title II rule published in April 2024, state and local governments — and the school
        districts they oversee — face concrete deadlines to bring their websites and mobile apps
        into compliance with WCAG 2.1 Level AA. Districts serving 50,000 or more people must
        comply by <strong>April 24, 2026</strong>; smaller districts have
        until <strong>April 26, 2027</strong>.
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
        The deadlines are approaching fast — April 2026 for larger districts and April 2027 for
        smaller ones. Districts that start now will have ample time to identify
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
        ambiguity: public entity websites must conform to WCAG 2.1 Level AA — by April 24, 2026
        for entities serving 50,000+ people, and by April 26, 2027 for smaller entities.
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
