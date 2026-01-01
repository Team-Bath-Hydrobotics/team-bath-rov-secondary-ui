import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { MainLayout } from '../layouts/MainLayout';
import { Telemetry } from '../pages/Telemetry';
import { Detection } from '../pages/Detection';
import { IcebergThreat } from '../pages/IcebergThreat';
import { Photogrammetry } from '../pages/Photogrammetry';
import { CoPilot } from '../pages/CoPilot';
import { EDna } from '../pages/EDna';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="copilot" replace />} />
          <Route path="copilot" element={<CoPilot />} />
          <Route path="telemetry" element={<Telemetry />} />
          <Route path="detection" element={<Detection />} />
          <Route path="edna" element={<EDna />} />
          <Route path="iceberg-threat" element={<IcebergThreat />} />
          <Route path="photogrammetry" element={<Photogrammetry />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
