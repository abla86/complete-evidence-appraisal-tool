/**
 * Local-first privacy inspection extracted from Research Privacy Inspector.
 * No network access. Signals are observations, not proof of tracking or compliance.
 */

import type { PrivacyInspectionResult } from '../shared/moduleContracts';

export interface PrivacyResourceInput {
  sourceUrl: string;
  externalUrls?: string[];
  trackingMarkers?: string[];
  analyzedAt?: string;
}

const DEFAULT_TRACKING_MARKERS = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'connect.facebook.net',
  'hotjar.com',
  'matomo',
  'clarity.ms',
  'segment.io',
  'amplitude.com',
  'mixpanel.com',
];

function hostname(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isTrackingHost(host: string, markers: string[]): boolean {
  return markers.some((marker) => host === marker || host.endsWith(`.${marker}`));
}

export function inspectPrivacy({
  sourceUrl,
  externalUrls = [],
  trackingMarkers = DEFAULT_TRACKING_MARKERS,
  analyzedAt = new Date().toISOString(),
}: PrivacyResourceInput): PrivacyInspectionResult {
  const normalizedExternalUrls = externalUrls.filter(Boolean);
  const externalHosts = [...new Set(normalizedExternalUrls.map(hostname).filter(Boolean))];
  const trackingHosts = externalHosts.filter((host) => isTrackingHost(host, trackingMarkers));
  const signals: PrivacyInspectionResult['signals'] = [];

  for (const host of externalHosts) {
    signals.push({
      host,
      category: 'external-resource',
      evidence: 'External resource observed in the inspected document.',
    });
  }

  for (const host of trackingHosts) {
    signals.push({
      host,
      category: 'tracking-indicator',
      evidence: 'Hostname matches a configured tracking-indicator pattern.',
    });
  }

  return {
    sourceUrl,
    analyzedAt,
    externalResourceCount: normalizedExternalUrls.length,
    externalHosts,
    trackingIndicatorCount: trackingHosts.length,
    trackingHosts,
    signals,
    localOnlyAnalysis: true,
    localOnly: true,
  };
}

export const TRACKING_INDICATORS = Object.freeze([...DEFAULT_TRACKING_MARKERS]);


