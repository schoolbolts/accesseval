// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiffInput {
  currentFingerprints: string[];
  previousFingerprints: string[];
  ignoredFingerprints: string[];
}

export interface DiffResult {
  newFingerprints: string[];
  fixedFingerprints: string[];
  persistingFingerprints: string[];
}

// ─── computeIssueDiff ─────────────────────────────────────────────────────────

export function computeIssueDiff(input: DiffInput): DiffResult {
  const { currentFingerprints, previousFingerprints, ignoredFingerprints } = input;

  const currentSet = new Set(currentFingerprints);
  const previousSet = new Set(previousFingerprints);
  const ignoredSet = new Set(ignoredFingerprints);

  // New: in current but not in previous
  const newFingerprints = currentFingerprints.filter((fp) => !previousSet.has(fp));

  // Persisting: in both current and previous
  const persistingFingerprints = previousFingerprints.filter((fp) => currentSet.has(fp));

  // Fixed: in previous but not in current, and not ignored
  const fixedFingerprints = previousFingerprints.filter(
    (fp) => !currentSet.has(fp) && !ignoredSet.has(fp)
  );

  return { newFingerprints, fixedFingerprints, persistingFingerprints };
}
