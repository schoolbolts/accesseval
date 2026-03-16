import type { Metadata } from 'next';
import Link from 'next/link';
import { posts } from './posts';

export const metadata: Metadata = {
  title: 'Accessibility Blog — ADA Compliance Tips for Schools & Governments',
  description:
    'Expert guides on website accessibility, ADA Title II compliance, WCAG standards, and digital inclusion for schools and government organizations.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogIndexPage() {
  return (
    <>
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-14">
            <p className="section-title mb-3">Blog</p>
            <h1 className="font-display text-display-lg text-ink mb-4">
              Accessibility Insights for Schools &amp; Governments
            </h1>
            <p className="font-body text-lg text-slate-600 max-w-2xl leading-relaxed">
              Practical guides on ADA compliance, WCAG standards, and keeping your public-facing
              websites accessible to everyone.
            </p>
          </div>

          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <article className="card p-8 transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <time
                      dateTime={post.date}
                      className="font-body text-sm text-slate-600"
                    >
                      {new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    <span className="text-slate-300" aria-hidden="true">
                      &middot;
                    </span>
                    <span className="font-body text-sm text-slate-600">
                      {post.readTime} read
                    </span>
                  </div>

                  <h2 className="font-display text-display-sm text-ink mb-2 group-hover:text-emerald-600 transition-colors">
                    {post.title}
                  </h2>

                  <p className="font-body text-slate-600 leading-relaxed mb-4">
                    {post.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-body font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
