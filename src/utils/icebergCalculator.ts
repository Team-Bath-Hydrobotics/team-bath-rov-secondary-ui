import { ThreatLevel } from '../types';
import type { ThreatLevelType, PlatformData } from '../types';

/** Earth radius in nautical miles */
const EARTH_RADIUS_NM = 3440.065;

/**
 * Haversine distance between two lat/lon points, returned in nautical miles.
 */
export function haversineDistanceNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_NM * c;
}

/**
 * Surface platform threat based on distance, with grounding override.
 *
 * - Green: distance > 10 nm, OR keel grounds before reaching platform
 * - Yellow: 5 <= distance <= 10 nm
 * - Red: distance < 5 nm
 */
export function surfaceThreat(
  distanceNm: number,
  keelDepth: number,
  platformDepth: number,
): ThreatLevelType {
  // Grounding override: iceberg grounds before reaching platform
  if (keelDepth >= 1.1 * platformDepth) {
    return ThreatLevel.GREEN;
  }

  if (distanceNm > 10) return ThreatLevel.GREEN;
  if (distanceNm >= 5) return ThreatLevel.YELLOW;
  return ThreatLevel.RED;
}

/**
 * Subsea asset threat based on distance and keel-to-depth ratio.
 *
 * Only threatened if distance <= 25 nm.
 * - Green (grounding): keel >= 1.1 * depth
 * - Red:  0.9 * depth <= keel < 1.1 * depth
 * - Yellow: 0.7 * depth <= keel < 0.9 * depth
 * - Green (safe passing): keel < 0.7 * depth
 */
export function subseaThreat(
  distanceNm: number,
  keelDepth: number,
  platformDepth: number,
): ThreatLevelType {
  if (distanceNm > 25) return ThreatLevel.GREEN;

  if (keelDepth >= 1.1 * platformDepth) return ThreatLevel.GREEN;
  if (keelDepth >= 0.9 * platformDepth) return ThreatLevel.RED;
  if (keelDepth >= 0.7 * platformDepth) return ThreatLevel.YELLOW;
  return ThreatLevel.GREEN;
}

/**
 * Calculate threat levels for all platforms given iceberg data.
 * Returns a new array of PlatformData with updated distances and threats.
 */
export function calculateIcebergThreats(
  icebergLat: number,
  icebergLon: number,
  keelDepth: number,
  platforms: PlatformData[],
): PlatformData[] {
  return platforms.map((platform) => {
    const distanceNm = haversineDistanceNm(
      icebergLat,
      icebergLon,
      platform.latitude,
      platform.longitude,
    );

    return {
      ...platform,
      distanceNm: Math.round(distanceNm * 100) / 100,
      surfaceThreatLevel: surfaceThreat(distanceNm, keelDepth, platform.oceanDepth),
      subseaThreatLevel: subseaThreat(distanceNm, keelDepth, platform.oceanDepth),
    };
  });
}
