'use client';

import { useState, useCallback } from 'react';
import type { ContrastInfo } from '@/lib/color-contrast';
import { contrastRatioFromHex, hexToHsl, hslToHex } from '@/lib/color-contrast';

interface ContrastPanelProps {
  contrast: ContrastInfo;
}

const STEP = 0.04; // ~4% lightness per click

function stepColor(hex: string, direction: 'darker' | 'lighter'): string {
  const [h, s, l] = hexToHsl(hex);
  const newL = direction === 'darker'
    ? Math.max(0, l - STEP)
    : Math.min(1, l + STEP);
  return hslToHex(h, s, newL);
}

function getLightness(hex: string): number {
  return hexToHsl(hex)[2];
}

export default function ContrastPanel({ contrast }: ContrastPanelProps) {
  const [fg, setFg] = useState(contrast.fgColor);
  const [bg, setBg] = useState(contrast.bgColor);

  const ratio = contrastRatioFromHex(fg, bg);
  const passes = ratio >= contrast.expectedRatio;
  const isOriginal = fg === contrast.fgColor && bg === contrast.bgColor;

  // Ratio as a percentage of target (capped at 150% for visual bar)
  const ratioPercent = Math.min((ratio / contrast.expectedRatio) * 100, 150);

  const adjustFg = useCallback((dir: 'darker' | 'lighter') => {
    setFg((prev) => stepColor(prev, dir));
  }, []);

  const adjustBg = useCallback((dir: 'darker' | 'lighter') => {
    setBg((prev) => stepColor(prev, dir));
  }, []);

  const reset = useCallback(() => {
    setFg(contrast.fgColor);
    setBg(contrast.bgColor);
  }, [contrast.fgColor, contrast.bgColor]);

  const copyValue = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Header bar */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-[0.2em]">
          Contrast Checker
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          WCAG AA {contrast.expectedRatio}:1{contrast.isLargeText ? ' large' : ''}
        </span>
      </div>

      {/* Preview strip */}
      <div
        className="px-5 py-4 transition-colors duration-150"
        style={{ backgroundColor: bg, color: fg }}
      >
        <div className="text-lg font-body font-semibold leading-snug">
          The quick brown fox jumps over the lazy dog
        </div>
        <div className="text-sm font-body mt-1 opacity-90">
          Sample paragraph text at body size to preview readability.
        </div>
      </div>

      {/* Ratio readout */}
      <div className="bg-slate-50 border-y border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Ratio number */}
          <div className="flex items-baseline gap-1">
            <span
              className={`font-mono text-2xl font-bold tabular-nums transition-colors duration-200 ${
                passes ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {ratio.toFixed(2)}
            </span>
            <span className="font-mono text-sm text-slate-400">:1</span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ease-out ${
                passes ? 'bg-emerald-500' : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(ratioPercent, 100)}%` }}
            />
          </div>

          {/* Pass/Fail badge */}
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wider transition-colors duration-200 ${
              passes
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {passes ? 'PASS' : 'FAIL'}
          </span>
        </div>
      </div>

      {/* Color adjusters */}
      <div className="grid grid-cols-2 divide-x divide-slate-200">
        {/* Foreground */}
        <ColorAdjuster
          label="Foreground"
          color={fg}
          original={contrast.fgColor}
          onDarker={() => adjustFg('darker')}
          onLighter={() => adjustFg('lighter')}
          onCopy={() => copyValue(fg)}
        />

        {/* Background */}
        <ColorAdjuster
          label="Background"
          color={bg}
          original={contrast.bgColor}
          onDarker={() => adjustBg('darker')}
          onLighter={() => adjustBg('lighter')}
          onCopy={() => copyValue(bg)}
        />
      </div>

      {/* Footer — reset + info */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <div className="text-[11px] font-body text-slate-500">
          {contrast.fontSize && (
            <span>
              {contrast.fontSize}
              {contrast.fontWeight ? ` / ${contrast.fontWeight}` : ''}
              {contrast.isLargeText ? ' (large text)' : ''}
            </span>
          )}
        </div>
        {!isOriginal && (
          <button
            type="button"
            onClick={reset}
            className="text-[11px] font-mono font-medium text-slate-500 hover:text-ink transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Color Adjuster Sub-Component ────────────────────────────────────────────

function ColorAdjuster({
  label,
  color,
  original,
  onDarker,
  onLighter,
  onCopy,
}: {
  label: string;
  color: string;
  original: string;
  onDarker: () => void;
  onLighter: () => void;
  onCopy: () => void;
}) {
  const lightness = getLightness(color);
  const changed = color !== original;

  return (
    <div className="p-4 space-y-3">
      {/* Label + hex */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.15em]">
          {label}
        </span>
        {changed && (
          <span className="text-[9px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
            modified
          </span>
        )}
      </div>

      {/* Swatch + hex value */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg border border-slate-200 shrink-0 transition-colors duration-150 shadow-sm"
          style={{ backgroundColor: color }}
        />
        <button
          type="button"
          onClick={onCopy}
          className="font-mono text-sm font-semibold text-ink hover:text-emerald-700 transition-colors cursor-copy"
          title="Copy hex"
        >
          {color}
        </button>
      </div>

      {/* Darken / Lighten steppers */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onDarker}
          disabled={lightness <= 0}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg
            border border-slate-200 bg-white
            text-xs font-mono font-medium text-slate-600
            hover:bg-slate-100 hover:border-slate-300 hover:text-ink
            active:bg-slate-200
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-100"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
            <circle cx="5" cy="5" r="4" fill="currentColor" opacity="0.7" />
          </svg>
          Darker
        </button>
        <button
          type="button"
          onClick={onLighter}
          disabled={lightness >= 1}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg
            border border-slate-200 bg-white
            text-xs font-mono font-medium text-slate-600
            hover:bg-slate-100 hover:border-slate-300 hover:text-ink
            active:bg-slate-200
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-100"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          </svg>
          Lighter
        </button>
      </div>
    </div>
  );
}
