/**
 * Detects CMS from page HTML content, meta tags, and asset URLs.
 * Returns a CmsType string matching the enum in schema.prisma.
 *
 * Ordered by specificity — niche education/gov CMSes first so they
 * aren't swallowed by a generic WordPress match (some wrap WP).
 */

interface CmsSignature {
  cms: string;
  patterns: RegExp[];
}

const SIGNATURES: CmsSignature[] = [
  // ─── K-12 Education CMSes (check first — some run on top of WP/Drupal) ────

  {
    cms: 'edlio',
    patterns: [
      /edliocloud\.com/i,
      /\.edlio\.com/i,
      /edlio-/i,
      /powered.by.edlio/i,
    ],
  },
  {
    cms: 'blackboard',
    patterns: [
      /schoolwires/i,
      /blackboard\.com/i,
      /\/cms\/lib/i,        // Blackboard CMS path pattern
      /bb-public/i,
      /blackbaud/i,
    ],
  },
  {
    cms: 'thrillshare',
    patterns: [
      /thrillshare/i,
      /apptegy/i,
      /cdn\.apptegy\.com/i,
      /thrillshare\.com/i,
    ],
  },
  {
    cms: 'finalsite',
    patterns: [
      /finalsite/i,
      /fsPageContent/i,
      /fs-resource/i,
      /\.finalsite\.com/i,
    ],
  },
  {
    cms: 'foxbright',
    patterns: [
      /foxbright/i,
      /\.foxbright\.com/i,
    ],
  },
  {
    cms: 'campussuite',
    patterns: [
      /campussuite/i,
      /campus-suite/i,
      /\.campussuite\.com/i,
    ],
  },
  {
    cms: 'schoolpointe',
    patterns: [
      /schoolpointe/i,
      /school-?pointe/i,
      /\.schoolpointe\.com/i,
    ],
  },

  // ─── Municipal/Government CMSes ────────────────────────────────────────────

  {
    cms: 'civicplus',
    patterns: [
      /civicplus/i,
      /civiclive/i,
      /cp-widget/i,
      /\.civicplus\.com/i,
    ],
  },
  {
    cms: 'granicus',
    patterns: [
      /granicus/i,
      /\.granicus\.com/i,
      /govdelivery/i,          // Granicus acquired GovDelivery
    ],
  },
  {
    cms: 'revize',
    patterns: [
      /revize/i,
      /\.revize\.com/i,
      /revize-cms/i,
    ],
  },

  // ─── Major general-purpose CMSes ───────────────────────────────────────────

  {
    cms: 'wordpress',
    patterns: [
      /wp-content\//i,
      /wp-includes\//i,
      /<meta[^>]+name=["']generator["'][^>]+content=["']WordPress/i,
      /wp-json/i,
    ],
  },
  {
    cms: 'drupal',
    patterns: [
      /Drupal\.settings/i,
      /\/sites\/default\/files/i,
      /<meta[^>]+name=["']generator["'][^>]+content=["']Drupal/i,
      /drupal\.js/i,
      /\/modules\/system/i,
    ],
  },
  {
    cms: 'joomla',
    patterns: [
      /<meta[^>]+name=["']generator["'][^>]+content=["']Joomla/i,
      /\/media\/jui\//i,
      /\/components\/com_/i,
    ],
  },
  {
    cms: 'squarespace',
    patterns: [
      /<!-- This is Squarespace/i,
      /static\.squarespace\.com/i,
      /sqsp-/i,
      /<meta[^>]+name=["']generator["'][^>]+content=["']Squarespace/i,
    ],
  },
  {
    cms: 'wix',
    patterns: [
      /static\.wixstatic\.com/i,
      /wix-code-sdk/i,
      /<meta[^>]+name=["']generator["'][^>]+content=["']Wix/i,
    ],
  },
  {
    cms: 'google_sites',
    patterns: [
      /sites\.google\.com/i,
      /data-site-canvas/i,
    ],
  },
];

export function detectCms(html: string): string {
  for (const sig of SIGNATURES) {
    if (sig.patterns.some((p) => p.test(html))) {
      return sig.cms;
    }
  }
  return 'unknown';
}
