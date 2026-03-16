'use client';

import type { ContrastInfo } from '@/lib/color-contrast';

interface ContrastPanelProps {
  contrast: ContrastInfo;
}

function RatioBadge({ ratio, target }: { ratio: number; target: number }) {
  const passes = ratio >= target;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
        passes
          ? 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200'
          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
      }`}
    >
      {ratio}:1
      <span className="text-[10px] font-medium">{passes ? 'PASS' : 'FAIL'}</span>
    </span>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg border border-slate-200 shrink-0"
        style={{ backgroundColor: color }}
      />
      <div>
        <div className="text-xs font-body text-slate-500">{label}</div>
        <div className="text-sm font-mono font-medium text-ink">{color}</div>
      </div>
    </div>
  );
}

export default function ContrastPanel({ contrast }: ContrastPanelProps) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-body font-semibold text-slate-700 uppercase tracking-wider">
          Color Contrast
        </h4>
        <div className="text-xs font-body text-slate-500">
          WCAG AA requires {contrast.expectedRatio}:1
          {contrast.isLargeText ? ' (large text)' : ''}
        </div>
      </div>

      {/* Current colors */}
      <div>
        <div className="text-[10px] font-body font-medium text-slate-500 uppercase tracking-wider mb-2">Current</div>
        <div className="flex items-center gap-6 flex-wrap">
          <ColorSwatch color={contrast.fgColor} label="Foreground" />
          <ColorSwatch color={contrast.bgColor} label="Background" />
          <RatioBadge ratio={contrast.currentRatio} target={contrast.expectedRatio} />
        </div>
        {/* Preview */}
        <div
          className="mt-2.5 rounded-lg px-3 py-2 text-sm font-body border border-slate-200"
          style={{ color: contrast.fgColor, backgroundColor: contrast.bgColor }}
        >
          Sample text with current colors
        </div>
      </div>

      {/* Recommended fix */}
      {contrast.suggestedColor && (
        <div>
          <div className="text-[10px] font-body font-medium text-emerald-800 uppercase tracking-wider mb-2">Recommended</div>
          <div className="flex items-center gap-6 flex-wrap">
            <ColorSwatch color={contrast.suggestedColor} label="New foreground" />
            <ColorSwatch color={contrast.bgColor} label="Background" />
            <RatioBadge ratio={contrast.suggestedRatio!} target={contrast.expectedRatio} />
          </div>
          {/* Preview */}
          <div
            className="mt-2.5 rounded-lg px-3 py-2 text-sm font-body border border-slate-200"
            style={{ color: contrast.suggestedColor, backgroundColor: contrast.bgColor }}
          >
            Sample text with recommended color
          </div>
        </div>
      )}

      {contrast.fontSize && (
        <div className="text-xs font-body text-slate-500">
          Font: {contrast.fontSize}
          {contrast.fontWeight ? `, weight ${contrast.fontWeight}` : ''}
          {contrast.isLargeText ? ' (large text)' : ''}
        </div>
      )}
    </div>
  );
}
