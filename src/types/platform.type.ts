export const ThreatLevel = {
  UNKNOWN: 'Unknown',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
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
  platformData: PlatformData[];
  imageFile: File | null;
};
