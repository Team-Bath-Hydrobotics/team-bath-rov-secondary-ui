export const ThreatLevel = {
  UNKNOWN: 'UNKNOWN',
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  RED: 'RED',
} as const;

export type ThreatLevelType = (typeof ThreatLevel)[keyof typeof ThreatLevel];

/**
  The data related to a platform and the threat level to it.
 */

export type PlatformData = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  oceanDepth: number;
  generalThreatLevel: (typeof ThreatLevel)[keyof typeof ThreatLevel];
  subsurfaceThreatLevel: (typeof ThreatLevel)[keyof typeof ThreatLevel];
};

export type IcebergCalculationData = {
  icebergDepth: number;
  icebergHeading: number;
  icebergLatitude: number;
  icebergLongitude: number;
  platformData: PlatformData[];
  imageFile: File | null;
};
