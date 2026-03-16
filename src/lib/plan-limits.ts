export const PLAN_LIMITS = {
  scan: {
    maxPages: 100,
    maxSites: 1,
    scanFrequency: 'monthly' as const,
    onDemandScansPerMonth: 2,
    teamMembers: 1,
    features: {
      issueTracking: false,
      progressChart: false,
      boardReport: false,
      accessibilityStatement: false,
      auditTrail: false,
      shareLinks: false,
      pdfInventory: false,
      cmsFixInstructions: false,
      weeklyDigest: false,
      aiFixSuggestions: false,
      invoicePayment: false,
    },
  },
  comply: {
    maxPages: 500,
    maxSites: Infinity,
    scanFrequency: 'weekly' as const,
    onDemandScansPerMonth: 5,
    teamMembers: 3,
    features: {
      issueTracking: true,
      progressChart: true,
      boardReport: true,
      accessibilityStatement: true,
      auditTrail: true,
      shareLinks: true,
      pdfInventory: true,
      cmsFixInstructions: false,
      weeklyDigest: true,
      aiFixSuggestions: false,
      invoicePayment: true,
    },
  },
  fix: {
    maxPages: 2000,
    maxSites: Infinity,
    scanFrequency: 'weekly' as const,
    onDemandScansPerMonth: Infinity,
    teamMembers: 10,
    features: {
      issueTracking: true,
      progressChart: true,
      boardReport: true,
      accessibilityStatement: true,
      auditTrail: true,
      shareLinks: true,
      pdfInventory: true,
      cmsFixInstructions: true,
      weeklyDigest: true,
      aiFixSuggestions: true,
      invoicePayment: true,
    },
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
export type FeatureName = keyof typeof PLAN_LIMITS.scan.features;

export function canUseFeature(plan: PlanName, feature: FeatureName): boolean {
  return PLAN_LIMITS[plan].features[feature];
}

export function getMaxPages(plan: PlanName): number {
  return PLAN_LIMITS[plan].maxPages;
}

export function getOnDemandLimit(plan: PlanName): number {
  return PLAN_LIMITS[plan].onDemandScansPerMonth;
}

export function getTeamMemberLimit(plan: PlanName): number {
  return PLAN_LIMITS[plan].teamMembers;
}

export function getMaxSites(plan: PlanName): number {
  return PLAN_LIMITS[plan].maxSites;
}
