import { MainContentLayout } from '../../layouts/MainContentLayout';
import { DetectorPage } from '../../features/detection/DetectorPage';

export const Detection = () => {
  return (
    <MainContentLayout name="Crab Detection">
      <DetectorPage />
    </MainContentLayout>
  );
};
