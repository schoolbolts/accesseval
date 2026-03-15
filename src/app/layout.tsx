import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: 'AccessEval — ADA Website Accessibility Scanner',
    template: '%s | AccessEval',
  },
  description: 'Scan your school or government website for ADA Title II compliance. Get a free accessibility report with plain-English fix instructions in minutes.',
  keywords: ['ada compliance', 'website accessibility', 'wcag 2.1', 'ada title ii', 'school website accessibility', 'government website compliance', 'accessibility scanner', 'ada website checker'],
  authors: [{ name: 'AccessEval' }],
  creator: 'AccessEval',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://accesseval.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AccessEval',
    title: 'AccessEval — ADA Website Accessibility Scanner',
    description: 'Scan your school or government website for ADA Title II compliance. Get a free accessibility report with plain-English fix instructions.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AccessEval — ADA Website Accessibility Scanner',
    description: 'Free ADA compliance scanner for schools and governments.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased font-body text-ink bg-white">
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H3XYWWW6P7"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-H3XYWWW6P7');`}
        </Script>
      </body>
    </html>
  );
}
