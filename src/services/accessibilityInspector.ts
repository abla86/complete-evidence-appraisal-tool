/**
 * Lightweight local accessibility signal inspector.
 * These checks are heuristic signals, not WCAG conformance certification.
 */

import type { AccessibilityInspectionResult } from '../shared/moduleContracts';

export interface AccessibilityInput {
  sourceUrl: string;
  images?: Array<{ hasAlt: boolean; alt: string }>;
  buttons?: Array<{ accessibleName?: string; ariaLabel?: string; title?: string; text?: string }>;
  h1Count?: number;
  mainLandmarkCount?: number;
  headingCount?: number;
  analyzedAt?: string;
}

export function inspectAccessibility({
  sourceUrl,
  images = [],
  buttons = [],
  h1Count = 0,
  mainLandmarkCount = 0,
  headingCount = 0,
  analyzedAt = new Date().toISOString(),
}: AccessibilityInput): AccessibilityInspectionResult {
  const missingAlt = images.filter((image) => !image.hasAlt).length;
  const emptyAlt = images.filter((image) => image.hasAlt && image.alt.trim() === '').length;
  const unnamedButtons = buttons.filter((button) =>
    ![button.accessibleName, button.ariaLabel, button.title, button.text]
      .some((value) => value && value.trim()),
  ).length;

  return {
    sourceUrl,
    analyzedAt,
    missingAlt,
    emptyAlt,
    unnamedButtons,
    h1Count,
    mainLandmarkCount,
    headingCount,
    checksAreSignals: true,
  };
}
