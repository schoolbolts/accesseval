export const PLAN_LIMITS = {
  scan: {
    maxPages: 100,
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
    },
  },
  comply: {
    maxPages: 500,
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
    },
  },
  fix: {
    maxPages: 2000,
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
