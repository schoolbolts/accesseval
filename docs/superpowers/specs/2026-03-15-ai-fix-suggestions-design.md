# AI Fix Suggestions — Design Spec

## Goal

Enhance AccessEval's fix instructions with AI-generated, context-specific suggestions for each accessibility issue. Instead of generic "Add alt text to this image," the system suggests the exact text: "Students walking into Lincoln Elementary on the first day of school."

## Background

Currently, fix instructions are static and pre-authored in `src/data/axe-translations.json` (79 axe rules, 13 CMS variants + generic). These tell users *what* to fix but not *specifically how* — users must figure out the actual content themselves. AI fix suggestions close that gap.

## Architecture

### Two-Phase Scan Pipeline

**Full scans (paid tiers):**
```
Phase 1 (existing, unchanged):
  Playwright + axe-core → issues stored with static fix instructions → user sees results

Phase 2 (new):
  BullMQ job triggered after Phase 1 → iterates issues → calls AI models → stores suggestions
```

Phase 2 runs asynchronously. Users see scan results immediately with static instructions. AI suggestions appear on next page load once Phase 2 completes.

**Free scans:**
AI suggestions run **inline** during `processFreeScan` (same pattern as `generateFreeScanSummary`). Only 5 issues, so ~15s additional processing. The user is already waiting for results — no separate job needed.

### Model Routing

| Issue Category | Model | Input | Examples |
|---|---|---|---|
| Missing/bad image alt text | Qwen3-VL-235B (vision) | Image URL extracted from `elementHtml` | `image-alt`, `image-redundant-alt` |
| Color contrast | Deterministic calculation | Computed colors from axe-core | `color-contrast` |
| Empty/vague link text | DeepSeek (text), vision fallback | Element HTML + href | `link-name`, `link-in-text-block` |
| Empty button/input labels | DeepSeek (text), vision fallback | Element HTML | `button-name`, `label`, `input-image-alt` |
| Heading issues | DeepSeek (text) | Page heading structure | `heading-order`, `empty-heading` |
| ARIA / structural | DeepSeek (text) | Element HTML + rule context | `aria-*` rules |

**Image URL extraction:** For `image-alt` issues, parse `elementHtml` to extract the `src` attribute. Resolve relative URLs against the page URL. Fetch the image bytes and send to the vision model. No element screenshots needed.

**Vision fallback rule:** If the text model's response for a non-image issue has no actionable content (just restates the generic instruction), and the element has no text content, retry with the vision model using the page screenshot (already stored for free scans; would need fetching for full scans — skip vision fallback for full scans in Phase 1).

**Color contrast — deterministic, no LLM:** Compute the nearest WCAG-compliant foreground color algorithmically. Darken or lighten the existing color until it meets the required ratio (4.5:1 for normal text, 3:1 for large text). Output the exact hex value. No LLM hallucination risk.

**Decorative image detection:** If the vision model identifies an image as purely decorative (divider, background pattern, generic stock photo), suggest `alt=""` rather than descriptive text.

### API Provider

DeepInfra (already used for scan narratives in `src/lib/ai-summary.ts`). Same endpoint, same auth.

- **Vision model:** `Qwen/Qwen3-VL-235B-A22B-Instruct` — $0.11/M cached, $0.20/M input, $0.88/M output
- **Text model:** DeepSeek via DeepInfra — ~$0.40/M tokens

## Data Model

Add three columns to the existing `Issue` model in `prisma/schema.prisma`:

```prisma
model Issue {
  // ...existing fields...
  aiFixSuggestion    String?   @map("ai_fix_suggestion")
  aiFixModel         String?   @map("ai_fix_model")     // "qwen-vl", "deepseek", "deterministic"
  aiFixGeneratedAt   DateTime? @map("ai_fix_generated_at")
}
```

For free scans, add `aiFixSuggestion` to each issue object in the `resultsJson` JSON blob (same pattern as `elementScreenshotUrl`).

No new tables. 1:1 with Issue — a separate table would add joins for no benefit.

## Worker Job

### New file: `worker/jobs/ai-fix-suggestions.ts`

**Triggered by:** Full-scan job queues this as a separate BullMQ job after Phase 1 completes. Free scans run AI inline (see below).

**Input:** `{ scanId: string }`

**Flow:**

1. Load all issues for the scan
2. **Deduplicate by fingerprint** — group issues sharing the same fingerprint, only generate one suggestion per unique fingerprint. Copy the result to all issues in the group. This dramatically reduces API calls (e.g., same missing-alt header image on 200 pages = 1 API call, not 200).
3. **Cap at 200 unique fingerprints** per scan, prioritized by severity (critical → major → minor). Prevents runaway costs/time on massive sites.
4. For each unique issue, determine model route based on `axeRuleId`
5. Build prompt with issue context (element HTML, page URL, CMS type, WCAG criteria)
6. Call DeepInfra API with `max_tokens: 150`
7. Store `aiFixSuggestion`, `aiFixModel`, `aiFixGeneratedAt` on each Issue row

**Concurrency:** Up to 5 parallel API calls. 200 unique issues at ~3s each = ~2 minutes with parallelism of 5.

**Job timeout:** 5 minutes. If exceeded, save whatever suggestions have been generated so far.

**Error handling:** If AI call fails for an issue, leave `aiFixSuggestion` as null. Static instructions remain as fallback. Log warning but don't fail the job. If DeepInfra rate-limits, back off and retry up to 3 times with exponential delay.

### Free scan inline processing

In `processFreeScan`, after scoring and before the final DB update, call the AI fix function for each of the 5 top issues inline. Same logic, just not queued as a separate job. Matches the existing pattern of `generateFreeScanSummary`.

### Cross-scan caching

Before calling the AI for an issue, check if a previous scan's `SiteIssue` with the same fingerprint already has an `aiFixSuggestion` on its most recent `Issue` row. If so, reuse it. This avoids re-generating identical suggestions for issues that persist across weekly scans.

### Prompts

**Image alt text (vision model):**
```
Describe this image in a single sentence for use as alt text. Be specific and concise.
If the image is purely decorative (a divider, background pattern, or generic stock photo), respond with exactly: decorative
```

Page context is included by appending: `This image appears on: {pageUrl}`

**Non-image issues (text model):**
```
You are an accessibility remediation assistant for a {cmsType} website.

Issue: {description}
WCAG: {wcagCriteria}
Element HTML: {elementHtml}
Page URL: {pageUrl}

Provide a specific, actionable fix in 1-2 sentences. If suggesting text content (link text, button label, heading), provide the exact text to use. If suggesting a code change, provide the exact attribute or CSS value. Do not include any preamble or explanation.
```

Element HTML is truncated to 500 characters before sending.

**Color contrast (deterministic — no LLM):**

Compute the nearest compliant color using the WCAG relative luminance formula. Adjust the foreground color lightness (in HSL space) until the contrast ratio meets the threshold. Output: `"Change color from {old} to {new} (contrast ratio: {ratio}:1)"`.

## UI Changes

### Dashboard issue detail (`src/app/(dashboard)/pages/[pageId]/page.tsx` and `src/components/issues/issues-list.tsx`)

Below the existing static fix instruction, add a "Suggested fix" block when `aiFixSuggestion` is present:

```
[Existing static instruction]
"Add a description to this image in your website editor..."

[New AI suggestion — only shown for Fix tier+]
 Suggested fix:
 "Students walking into Lincoln Elementary on the first day of school"  [Copy]
```

- Visually distinct (subtle emerald-50 background, left border accent)
- "Copy" button for easy clipboard copy
- If `aiFixSuggestion` is null (still processing or failed), don't show anything — static instruction is the fallback

Update the `IssueItem` interface in `issues-list.tsx` to include `aiFixSuggestion`.

### Free scan results (`src/components/scan/scan-progress.tsx`)

Same pattern — show AI suggestion below static instruction for each issue card. No tier gate on free scans (it's a teaser to demonstrate Fix tier value).

### API route (`src/app/api/scan/free/[token]/route.ts`)

Pass `aiFixSuggestion` through in the response alongside existing issue fields.

## Feature Gating

Add `aiFixSuggestions: true` to the Fix tier in `src/lib/plan-limits.ts`. Gate the display in dashboard components with `canUseFeature(plan, 'aiFixSuggestions')`.

Free scans show AI suggestions ungated (marketing/conversion tool).

## Security

- Truncate `elementHtml` to 500 characters before sending to DeepInfra
- Image URLs are fetched server-side by the worker, not passed to the client
- Document in privacy policy that page content may be processed by third-party AI for fix suggestions

## Cost

- ~100 output tokens per issue average
- Vision: $0.88/M output = $0.00009/issue
- Text: $0.40/M output = $0.00004/issue
- Fingerprint deduplication reduces calls by ~60-80% for multi-page sites
- **~$0.01 per scan** (200 unique issues, 20 images + 180 text)
- Fix tier at $599/yr with weekly scans: ~$0.50/month AI cost
- Cap at 200 unique fingerprints prevents runaway costs on large sites

## Scope — Phase 1 (Build Now)

**Issue categories with AI suggestions:**
- Image alt text (vision model)
- Color contrast (deterministic color calculation)
- Link purpose / empty links (text model)
- Button names / empty buttons (text model)
- Form labels (text model)
- Heading issues (text model)

## Scope — Phase 2 (Future)

- All remaining axe rules (ARIA, structural, timing, etc.)
- Vision fallback for full scan issues (requires storing element screenshots)
- "Apply" button that pushes fix via CMS API (Manage tier)
- Revision history (track AI suggestion changes across scans)
- User feedback loop (thumbs up/down on suggestions to improve prompts)

## Files Affected

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add 3 columns to Issue model |
| `worker/jobs/ai-fix-suggestions.ts` | New file — AI enrichment job for full scans |
| `worker/jobs/full-scan.ts` | Queue AI enrichment job after scan completes |
| `worker/jobs/free-scan.ts` | Run AI suggestions inline for 5 issues |
| `worker/index.ts` | Register new `ai-enrichment` queue worker |
| `src/lib/queue.ts` | Add `aiEnrichmentQueue` |
| `src/lib/ai-fix.ts` | New file — AI model routing, prompt building, DeepInfra calls, contrast calculation |
| `src/lib/plan-limits.ts` | Add `aiFixSuggestions` feature flag |
| `src/app/api/scan/free/[token]/route.ts` | Pass `aiFixSuggestion` in response |
| `src/components/issues/issues-list.tsx` | Update `IssueItem` type, render AI suggestion block |
| `src/app/(dashboard)/pages/[pageId]/page.tsx` | Render AI suggestion block |
| `src/components/scan/scan-progress.tsx` | Render AI suggestion in free scan results |
