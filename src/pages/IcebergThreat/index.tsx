import { MainContentLayout } from '../../layouts/MainContentLayout';
import { useAppStateContext } from '../../context';
import { TextInput } from '../../components/Inputs/TextInput';
import { Box } from '@mui/material';
import VerticalPageContentLayout from '../../layouts/VerticalPageContentLayout/VerticalPageContentLayout';
import { UploadComponent } from '../../components/Inputs/UploadComponent';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout';
import { FlexibleDataGrid } from '../../components/Inputs/FlexibleDataGrid';
import { Button } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { ImageTile } from '../../components/Tiles/ImageTile';
import { type GridValidRowModel } from '@mui/x-data-grid';
import type { PlatformData } from '../../types';
import { ThreatLevel } from '../../types';
import { ThreatChip } from '../../components/Chips';
import { useState } from 'react';

const NM_PER_DEGREE = 60; // Nautical miles per degree of latitude anywhere, and per degree of longitude at the equator.
// Longitude degrees get smaller as you move towards the poles, which is accounted for in the latlonToNm function.

const latlonToNm = (latRef: number, lonRef: number, lat: number, lon: number): [number, number] => {
  const y = (lat - latRef) * NM_PER_DEGREE;
  // Adjust x distance by cosine of latitude to account for convergence of longitude lines
  const x = (lon - lonRef) * NM_PER_DEGREE * Math.cos((latRef * Math.PI) / 180);
  return [x, y];
};

const headingToUnitVector = (heading: number): [number, number] => {
  const rad = (heading * Math.PI) / 180;
  return [Math.sin(rad), Math.cos(rad)];
};

const distancePointToLine = (px: number, py: number, dx: number, dy: number): number => {
  // Enforce unit vector for line direction
  return Math.abs(px * dy - py * dx) / Math.sqrt(dx * dx + dy * dy);
};

const nauticalDistanceFromData = (
  platformLongitude: number,
  platformLatitude: number,
  icebergHeading: number,
  icebergLatitude: number,
  icebergLongitude: number,
) => {
  const [dx, dy] = headingToUnitVector(icebergHeading);
  const [px, py] = latlonToNm(
    icebergLatitude,
    icebergLongitude,
    platformLatitude,
    platformLongitude,
  );

  // Project platform vector onto iceberg track direction
  // Negative t means the closest point on the infinite line is BEHIND the iceberg's start
  const t = px * dx + py * dy;

  if (t < 0) {
    // Iceberg has not yet reached (and will never reach) the closest point —
    // use straight-line distance from iceberg start position to platform instead
    return Math.sqrt(px * px + py * py);
  }
  const distanceNm = distancePointToLine(px, py, dx, dy);
  return distanceNm;
};

const surfaceThreat = (
  distanceNm: number,
  keelDepth: number,
  waterDepth: number,
): keyof typeof ThreatLevel => {
  if (keelDepth >= 1.1 * waterDepth) return 'GREEN';
  if (distanceNm > 10) return 'GREEN';
  if (distanceNm >= 5) return 'YELLOW';
  return 'RED';
};

const subseaThreat = (
  distanceNm: number,
  keelDepth: number,
  waterDepth: number,
): keyof typeof ThreatLevel => {
  if (distanceNm > 25) return 'GREEN';
  const ratio = keelDepth / waterDepth;
  if (ratio >= 1.1) return 'GREEN';
  if (ratio >= 0.9) return 'RED';
  if (ratio >= 0.7) return 'YELLOW';
  return 'GREEN';
};

const MAP_BOUNDS = {
  lonMin: -49.4,
  lonMax: -47.9,
  latMin: 46.5,
  latMax: 48.0,
};

const latLonToPixel = (
  latitude: number,
  longitude: number,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number } => {
  const x =
    ((longitude - MAP_BOUNDS.lonMin) / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)) * imageWidth;
  // Y is inverted — pixel 0 is at the top, but latitude increases upward
  const y =
    ((MAP_BOUNDS.latMax - latitude) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * imageHeight;
  return { x, y };
};

const IcebergThreatContent = () => {
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(
    null,
  );
  const { state, updateIcebergCalculationData } = useAppStateContext();
  const {
    icebergDepth,
    icebergHeading,
    icebergLatitude,
    icebergLongitude,
    platformData,
    imageFile,
  } = state.icebergCalculationData;

  const platformInputColumns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, editable: true, headerClassName: 'bold-header' },
    {
      field: 'latitude',
      headerName: 'Latitude',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
    {
      field: 'oceanDepth',
      headerName: 'Ocean Depth',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
  ];

  const platformOutputColumns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, headerClassName: 'bold-header' },
    {
      field: 'generalThreatLevel',
      headerName: 'General Threat',
      flex: 1,
      headerClassName: 'bold-header',
      renderCell: (params) => <ThreatChip level={params.value as keyof typeof ThreatLevel} />,
    },

    {
      field: 'subsurfaceThreatLevel',
      headerName: 'Subsurface Threat',
      flex: 1,
      headerClassName: 'bold-header',
      renderCell: (params) => <ThreatChip level={params.value as keyof typeof ThreatLevel} />,
    },
  ];

  const handleRowUpdate = (newRow: GridValidRowModel) => {
    const updatedData = platformData.map((row) => (row.id === newRow.id ? newRow : row));
    updateIcebergCalculationData({
      icebergDepth,
      icebergHeading,
      icebergLatitude,
      icebergLongitude,
      platformData: updatedData as PlatformData[],
      imageFile,
    });
    return newRow;
  };

  const calculateThreats = () => {
    const updated = platformData.map((p) => {
      const distanceNm = nauticalDistanceFromData(
        Number(p.longitude),
        Number(p.latitude),
        icebergHeading,
        icebergLatitude,
        icebergLongitude,
      );

      return {
        ...p,
        generalThreatLevel: surfaceThreat(distanceNm, icebergDepth, Number(p.oceanDepth)),
        subsurfaceThreatLevel: subseaThreat(distanceNm, icebergDepth, Number(p.oceanDepth)),
      };
    });

    updateIcebergCalculationData({
      icebergDepth,
      icebergHeading: icebergHeading,
      icebergLatitude: icebergLatitude,
      icebergLongitude: icebergLongitude,
      platformData: updated as PlatformData[],
      imageFile,
    });
  };

  const resetThreats = () => {
    const updated = platformData.map((p) => {
      return {
        ...p,
        generalThreatLevel: 'UNKNOWN',
        subsurfaceThreatLevel: 'UNKNOWN',
      };
    });

    updateIcebergCalculationData({
      icebergDepth,
      icebergHeading,
      icebergLatitude,
      icebergLongitude,
      platformData: updated as PlatformData[],
      imageFile,
    });
  };

  return (
    <Box sx={{ padding: 2 }}>
      <HorizontalPageContentLayout>
        <VerticalPageContentLayout>
          <UploadComponent
            buttonText="Upload Iceberg Data"
            displayText={imageFile ? imageFile.name : 'No file uploaded'}
            // Extract only the first uploaded file, as iceberg page only keeps track of one image
            onChange={(value) =>
              updateIcebergCalculationData({
                icebergDepth,
                platformData,
                imageFile: value[0],
                icebergHeading,
                icebergLatitude,
                icebergLongitude,
              })
            }
            accept={'.JPG, .PNG, .JPEG, .jpeg, .png, .heic'}
          ></UploadComponent>
          <Box sx={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
            <ImageTile
              imagefile={imageFile ?? new File([], 'Iceberg Map.png')}
              altTitle="Iceberg Image"
              onDimensionsChange={(width, height) => setImageDimensions({ width, height })}
            />
            {imageDimensions && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                }}
              >
                {(() => {
                  const { x, y } = latLonToPixel(
                    icebergLatitude,
                    icebergLongitude,
                    imageDimensions.width,
                    imageDimensions.height,
                  );
                  const [dx, dy] = headingToUnitVector(icebergHeading);
                  // Scale to cross the map — diagonal of the image guarantees it exits any edge
                  const trackLength = Math.sqrt(
                    imageDimensions.width ** 2 + imageDimensions.height ** 2,
                  ); // Limit track length to 250 pixels or the distance to the iceberg, whichever is smaller
                  return (
                    <>
                      <circle cx={x} cy={y} r={3} fill="red" />
                      <line
                        x1={x}
                        y1={y}
                        x2={x + dx * trackLength}
                        y2={y - dy * trackLength} // negative because screen Y is inverted relative to north
                        stroke="red"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                      />
                    </>
                  );
                })()}
              </svg>
            )}
          </Box>
          <HorizontalPageContentLayout>
            <TextInput
              label="Iceberg Keel Depth"
              value={icebergDepth.toString()}
              onChange={(value) => {
                const numValue = value === '' ? 0 : Number(value);
                if (!isNaN(numValue)) {
                  updateIcebergCalculationData({
                    icebergDepth: numValue,
                    platformData,
                    imageFile,
                    icebergHeading,
                    icebergLatitude,
                    icebergLongitude,
                  });
                }
              }}
            ></TextInput>
            <TextInput
              label="Iceberg Latitude"
              value={icebergLatitude.toString()}
              onChange={(value) => {
                const numValue = value === '' ? 0 : Number(value);
                if (!isNaN(numValue)) {
                  updateIcebergCalculationData({
                    icebergLatitude: numValue,
                    platformData,
                    imageFile,
                    icebergDepth,
                    icebergHeading,
                    icebergLongitude,
                  });
                }
              }}
            ></TextInput>
            <TextInput
              label="Iceberg Longitude"
              value={icebergLongitude.toString()}
              onChange={(value) => {
                const numValue = value === '' ? 0 : Number(value);
                const longitude = numValue > 0 ? -numValue : numValue;
                if (!isNaN(numValue)) {
                  updateIcebergCalculationData({
                    icebergLongitude: longitude,
                    platformData,
                    imageFile,
                    icebergDepth,
                    icebergHeading,
                    icebergLatitude,
                  });
                }
              }}
            ></TextInput>
            <TextInput
              label="Iceberg Heading"
              value={icebergHeading.toString()}
              onChange={(value) => {
                const numValue = value === '' ? 0 : Number(value);
                if (!isNaN(numValue)) {
                  updateIcebergCalculationData({
                    icebergHeading: numValue,
                    platformData,
                    imageFile,
                    icebergDepth,
                    icebergLatitude,
                    icebergLongitude,
                  });
                }
              }}
            ></TextInput>
          </HorizontalPageContentLayout>
          <HorizontalPageContentLayout>
            <Button variant="contained" onClick={calculateThreats}>
              Calculate
            </Button>
            <Button variant="contained" onClick={resetThreats}>
              Reset
            </Button>
          </HorizontalPageContentLayout>
        </VerticalPageContentLayout>
        <VerticalPageContentLayout>
          <FlexibleDataGrid
            data={platformData}
            columns={platformInputColumns}
            onProcessRowUpdate={handleRowUpdate}
          ></FlexibleDataGrid>
          <FlexibleDataGrid
            data={platformData}
            columns={platformOutputColumns}
            onProcessRowUpdate={handleRowUpdate}
          ></FlexibleDataGrid>
        </VerticalPageContentLayout>
      </HorizontalPageContentLayout>
    </Box>
  );
};

export const IcebergThreat = () => {
  return (
    <MainContentLayout name="Iceberg Threat">
      <IcebergThreatContent />
    </MainContentLayout>
  );
};
