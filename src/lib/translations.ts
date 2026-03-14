import translations from '@/data/axe-translations.json';

interface AxeTranslation {
  severity: string;
  title: string;
  description: string;
  wcag: string;
  fix: Record<string, string>;
}

const translationMap = translations as Record<string, AxeTranslation>;

export function getTranslation(axeRuleId: string): AxeTranslation | undefined {
  return translationMap[axeRuleId];
}

export function getFixInstruction(axeRuleId: string, cmsType: string): string | undefined {
  const translation = translationMap[axeRuleId];
  if (!translation) return undefined;
  return translation.fix[cmsType] ?? translation.fix.generic;
}
