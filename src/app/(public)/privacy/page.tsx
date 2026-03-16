import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — AccessEval',
  description: 'How AccessEval collects, uses, and protects your information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="font-display text-display-lg text-ink mb-2">Privacy Policy</h1>
      <p className="font-body text-sm text-slate-600 mb-10">Last updated: March 15, 2026</p>

      <div className="prose-legal">
        <p>
          AccessEval (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides website
          accessibility scanning services for school districts, municipalities, and other
          government entities. This privacy policy explains how we collect, use, and protect
          information when you use our website and services at accesseval.com.
        </p>

        <h2>Information we collect</h2>

        <h3>Account information</h3>
        <p>
          When you create an account, we collect your name, email address, and an encrypted
          password. If you sign up for a paid plan, payment is processed by Stripe — we do
          not store your credit card number, bank account details, or other payment
          credentials on our servers.
        </p>

        <h3>Free scan information</h3>
        <p>
          When you use our free scan tool, we collect the URL you submit and your IP address
          (for rate limiting). If you optionally provide your email address to unlock
          additional scan results, we store that email. We do not collect any information
          about the visitors to the websites we scan.
        </p>

        <h3>Scan data</h3>
        <p>
          When we scan a website, we collect publicly available information from that website
          including page content, HTML structure, and screenshots of pages. This data is used
          solely to generate accessibility reports for the site owner. We do not collect
          personal information about website visitors, students, parents, or members of the
          public who visit the sites we scan.
        </p>

        <h3>Usage data</h3>
        <p>
          We collect basic analytics about how you interact with our service, such as pages
          viewed and features used. This data is stored in our own database and is not shared
          with third-party analytics providers.
        </p>

        <h2>How we use your information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our accessibility scanning services</li>
          <li>Send you scan results and compliance reports</li>
          <li>Send account-related emails (password resets, billing confirmations)</li>
          <li>Respond to your questions and support requests</li>
        </ul>

        <h2>What we do NOT do</h2>
        <ul>
          <li>We do <strong>not</strong> sell, rent, or share your personal information with third parties for marketing purposes</li>
          <li>We do <strong>not</strong> use your data for advertising or profiling</li>
          <li>We do <strong>not</strong> collect information about students, minors, or members of the public who visit the websites we scan</li>
          <li>We do <strong>not</strong> share your email address with any third party</li>
        </ul>

        <h2>Data storage and security</h2>
        <p>
          Your data is stored in encrypted databases hosted in the United States. Passwords
          are hashed using bcrypt and are never stored in plain text. All data transmission
          is encrypted via TLS/SSL. We retain account data for the duration of your
          subscription and delete it upon request after account closure.
        </p>

        <h2>Third-party services</h2>
        <p>We use the following third-party services to operate:</p>
        <ul>
          <li><strong>Stripe</strong> — Payment processing. Stripe&apos;s privacy policy applies to payment data.</li>
          <li><strong>Amazon Web Services (SES)</strong> — Transactional email delivery.</li>
          <li><strong>Cloudflare</strong> — CDN and DDoS protection.</li>
        </ul>
        <p>These services process only the minimum data necessary for their function.</p>

        <h2>FERPA and student data</h2>
        <p>
          AccessEval does not access, collect, or store student education records or
          personally identifiable information (PII) of students. Our service scans the
          publicly accessible portions of school district websites only. We are not a
          &quot;school official&quot; under FERPA and do not require access to any student
          data to provide our services.
        </p>

        <h2>COPPA compliance</h2>
        <p>
          Our service is designed for use by adult administrators of school districts and
          government entities. We do not knowingly collect personal information from children
          under 13. If we learn that we have collected information from a child under 13, we
          will delete it promptly.
        </p>

        <h2>Your rights</h2>
        <p>You may at any time:</p>
        <ul>
          <li>Request a copy of the data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Opt out of non-essential emails</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{' '}
          <a href="mailto:support@accesseval.com">support@accesseval.com</a>.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. We will notify registered users of
          material changes via email. The &quot;last updated&quot; date at the top of this
          page indicates when the policy was most recently revised.
        </p>

        <h2>Contact us</h2>
        <p>
          If you have questions about this privacy policy or our data practices, contact us
          at <a href="mailto:support@accesseval.com">support@accesseval.com</a>.
        </p>
      </div>
    </div>
  );
}
