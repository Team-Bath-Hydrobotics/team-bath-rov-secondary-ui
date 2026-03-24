export const ThreatLevel = {
  UNKNOWN: 'Unknown',
  GREEN: 'Green',
  YELLOW: 'Yellow',
  RED: 'Red',
} as const;

export type ThreatLevelType = (typeof ThreatLevel)[keyof typeof ThreatLevel];

/**
 * The data related to a platform and the threat level to it.
 */
export type PlatformData = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  oceanDepth: number;
  distanceNm: number;
  surfaceThreatLevel: ThreatLevelType;
  subseaThreatLevel: ThreatLevelType;
};

export type IcebergCalculationData = {
  icebergLat: number;
  icebergLon: number;
  icebergHeading: number;
  keelDepth: number;
  platformData: PlatformData[];
  imageFile: File | null;
};
