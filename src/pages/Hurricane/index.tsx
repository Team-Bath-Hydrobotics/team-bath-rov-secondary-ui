import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import { landPath } from './land';
import {
  downloadFile,
  makePrompt,
  observationsCsv,
  readObservations,
  SAMPLE_OBSERVATIONS,
  STORAGE_KEY,
} from './model';
import type { Observation } from './model';
import { hurricaneService } from './service';
import type { HurricaneService, DetectionResult, TrackResult, PredictionResult } from './service';

type Phase = 'empty' | 'ready' | 'analysing' | 'review' | 'saved';
interface SourceImage {
  name: string;
  url: string;
  width: number;
  height: number;
  file?: File;
}
const phaseLabels: Record<Phase, string> = {
  empty: 'Awaiting image',
  ready: 'Ready to analyse',
  analysing: 'Analysing image',
  review: 'Ready for review',
  saved: 'Added to track',
};

export function Hurricane({ service = hurricaneService }: { service?: HurricaneService }) {
  const [tab, setTab] = useState(0);
  const [image, setImage] = useState<SourceImage | null>(null);
  const [phase, setPhase] = useState<Phase>('empty');
  const [observations, setObservations] = useState<Observation[]>(() =>
    readObservations().filter((p) => (p.method ?? 'demo') === service.mode),
  );
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [track, setTrack] = useState<TrackResult | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [pathWorking, setPathWorking] = useState(false);
  const [prompt, setPrompt] = useState(() => makePrompt(observations));
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const graphic = useRef<SVGSVGElement>(null);
  const detectionRequest = useRef<AbortController | null>(null);
  const pathRequest = useRef<AbortController | null>(null);
  const request = useRef(0);
  const imageUrl = useRef('');

  useEffect(
    () => () => {
      request.current++;
      detectionRequest.current?.abort();
      pathRequest.current?.abort();
      if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    },
    [],
  );

  function updateObservations(next: Observation[]) {
    pathRequest.current?.abort();
    setPathWorking(false);
    setTrack(null);
    setNotice('');
    setObservations(next);
    setPrediction(null);
    setPrompt(makePrompt(next));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setError('Observations could not be saved in this browser. Export a copy to keep them.');
    }
  }

  function replaceImage(next: SourceImage) {
    detectionRequest.current?.abort();
    setDetection(null);
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    imageUrl.current = next.url;
    setImage(next);
    setPhase('ready');
    setError('');
    setNotice('');
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Choose a PNG, JPEG or WebP image.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Choose an image smaller than 15 MB.');
      return;
    }
    const id = ++request.current;
    const url = URL.createObjectURL(file),
      loaded = new Image();
    loaded.onload = () => {
      if (id !== request.current) {
        URL.revokeObjectURL(url);
        return;
      }
      replaceImage({
        file,
        name: file.name,
        url,
        width: loaded.naturalWidth,
        height: loaded.naturalHeight,
      });
    };
    loaded.onerror = () => {
      URL.revokeObjectURL(url);
      if (id === request.current) setError('This image could not be opened. Try another image.');
    };
    loaded.src = url;
  }

  function sampleImage() {
    request.current++;
    replaceImage({ name: 'Example hurricane map', url: '', width: 720, height: 360 });
  }

  async function detect() {
    if (!image || phase === 'analysing') return;
    detectionRequest.current?.abort();
    const controller = new AbortController();
    detectionRequest.current = controller;
    setDetection(null);
    setPhase('analysing');
    setNotice('');
    setError('');
    try {
      const response = await service.detect(image, controller.signal);
      if (controller.signal.aborted) return;
      setDetection(response);
      setPhase(response.status === 'found' ? 'review' : 'ready');
      setNotice(
        response.status === 'not_found'
          ? 'No eye found. Try another image.'
          : response.position
            ? 'Analysis complete.'
            : 'Eye located. Geographic coordinates are unavailable.',
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setPhase('ready');
      setError(error instanceof Error ? error.message : 'Detection failed. Please retry.');
    }
  }

  async function generatePath(predict: boolean) {
    if (observations.length < 2 || pathWorking) return;
    pathRequest.current?.abort();
    const controller = new AbortController();
    pathRequest.current = controller;
    setPathWorking(true);
    setPrediction(null);
    setError('');
    setNotice('');
    try {
      const nextTrack = track ?? (await service.buildTrack(observations, controller.signal));
      if (controller.signal.aborted) return;
      setTrack(nextTrack);
      if (predict) {
        const response = await service.predict(nextTrack, prompt, controller.signal);
        if (controller.signal.aborted) return;
        setPrediction(response);
      }
      setNotice(predict ? 'Prediction ready.' : 'Track ready.');
    } catch (error) {
      if (!controller.signal.aborted)
        setError(error instanceof Error ? error.message : 'Path generation failed. Please retry.');
    } finally {
      if (!controller.signal.aborted) setPathWorking(false);
    }
  }

  function cancel() {
    detectionRequest.current?.abort();
    pathRequest.current?.abort();
    setPathWorking(false);
    if (phase === 'analysing') setPhase('ready');
    setNotice('Cancelled.');
  }

  function addObservation() {
    if (phase !== 'review' || !image || detection?.status !== 'found' || !detection.position)
      return;
    updateObservations([
      ...observations,
      {
        id: crypto.randomUUID(),
        ...detection.position,
        source: image.name,
        method: service.mode,
        model: detection.model,
      },
    ]);
    setPhase('saved');
    setNotice('Observation added to track.');
  }

  function exportGraphic() {
    if (!graphic.current) return;
    const clone = graphic.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    downloadFile(
      'hurricane-track.svg',
      new XMLSerializer().serializeToString(clone),
      'image/svg+xml',
    );
  }

  const result = phase === 'review' || phase === 'saved';
  const busy = phase === 'analysing';
  const latest = (track?.points ?? observations).at(-1);
  const eye = detection?.status === 'found' ? detection.eye : null;
  const location = detection?.status === 'found' ? detection.position : null;

  return (
    <MainContentLayout name="Hurricane">
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1500, mx: 'auto' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          sx={{ mb: 2, flexWrap: 'wrap' }}
        >
          <Tabs
            value={tab}
            onChange={(_, value: number) => {
              setTab(value);
              setNotice('');
            }}
            aria-label="Hurricane task stages"
            variant="scrollable"
            scrollButtons="auto"
            textColor="inherit"
            indicatorColor="secondary"
          >
            {['Eye detection', 'Hurricane track', 'AI prediction'].map((label, i) => (
              <Tab
                key={label}
                label={label}
                id={`hurricane-tab-${i}`}
                aria-controls={`hurricane-panel-${i}`}
              />
            ))}
          </Tabs>
          <Chip
            label={service.mode === 'demo' ? 'Demo' : 'Backend'}
            size="small"
            variant="outlined"
          />
        </Stack>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          role="tabpanel"
          id={`hurricane-panel-${tab}`}
          aria-labelledby={`hurricane-tab-${tab}`}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 300px' },
            gap: 3,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {['Hurricane image', 'Observed movement', 'Movement and predicted path'][tab]}
            </Typography>
            {tab === 0 ? (
              image ? (
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                  }}
                >
                  <svg
                    viewBox={`0 0 ${image.width} ${image.height}`}
                    role="img"
                    aria-label="Hurricane source image"
                    style={{ display: 'block', width: '100%', maxHeight: 540 }}
                  >
                    {image.url ? (
                      <image href={image.url} width={image.width} height={image.height} />
                    ) : (
                      <>
                        <rect width="720" height="360" fill="#0b2038" />
                        <path d={landPath} fill="#405b73" />
                        <g fill="#dce5ef" opacity="0.8">
                          <ellipse
                            cx="240"
                            cy="140"
                            rx="22"
                            ry="10"
                            transform="rotate(-28 240 140)"
                          />
                          <ellipse
                            cx="240"
                            cy="140"
                            rx="10"
                            ry="19"
                            transform="rotate(-28 240 140)"
                          />
                        </g>
                        <circle cx="240" cy="140" r="4" fill="#0b2038" />
                      </>
                    )}
                    {result && eye && (
                      <g stroke="#e94560" fill="none" strokeWidth={image.width / 320}>
                        <circle
                          cx={image.width * eye.x}
                          cy={image.height * eye.y}
                          r={image.width / 45}
                        />
                        <path
                          d={`M${image.width * eye.x - image.width / 30} ${image.height * eye.y}h${image.width / 15} M${image.width * eye.x} ${image.height * eye.y - image.width / 30}v${image.width / 15}`}
                        />
                      </g>
                    )}
                  </svg>
                  {busy && (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      gap={2}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'rgba(10,20,40,.8)',
                        color: '#fff',
                      }}
                    >
                      <CircularProgress color="inherit" />
                      <Typography>Analysing image…</Typography>
                    </Stack>
                  )}
                </Box>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{ py: 8, px: 3, borderStyle: 'dashed', textAlign: 'center' }}
                >
                  <UploadFileIcon sx={{ fontSize: 40, opacity: 0.65, mb: 2 }} />
                  <Typography variant="h5">Add a hurricane image</Typography>
                  <Typography sx={{ mt: 1, mb: 3, opacity: 0.7 }}>
                    {service.mode === 'demo'
                      ? 'Upload an image or choose an example.'
                      : 'Upload a hurricane image.'}
                  </Typography>
                  <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={2}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => input.current?.click()}
                    >
                      Choose image
                    </Button>
                    {service.mode === 'demo' && (
                      <Button color="inherit" onClick={sampleImage}>
                        Try an example
                      </Button>
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.7 }}>
                    PNG, JPEG or WebP · up to 15 MB
                  </Typography>
                </Paper>
              )
            ) : (
              <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#0b2038' }}>
                <svg
                  ref={graphic}
                  viewBox="0 0 720 360"
                  role="img"
                  aria-label="Hurricane track map"
                  style={{ display: 'block', width: '100%' }}
                >
                  <title>Hurricane track</title>
                  <rect width="720" height="360" fill="#0b2038" />
                  <path d={landPath} fill="#405b73" />
                  <polyline
                    points={(track?.points ?? observations)
                      .map((p) => `${360 + 2 * p.longitude},${180 - 2 * p.latitude}`)
                      .join(' ')}
                    fill="none"
                    stroke="#53c9e4"
                    strokeWidth="2"
                  />
                  {observations.map((p) => (
                    <circle
                      key={p.id}
                      cx={360 + 2 * p.longitude}
                      cy={180 - 2 * p.latitude}
                      r="3"
                      fill="#fff"
                    />
                  ))}
                  {tab === 2 && prediction && prediction.points.length > 0 && latest && (
                    <polyline
                      data-testid="predicted-path"
                      points={[latest, ...prediction.points]
                        .map((p) => `${360 + 2 * p.longitude},${180 - 2 * p.latitude}`)
                        .join(' ')}
                      fill="none"
                      stroke="#e94560"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                    />
                  )}
                </svg>
              </Box>
            )}
            {tab === 2 && prediction?.graphicUrl && (
              <Box
                component="img"
                src={prediction.graphicUrl}
                alt="Generated hurricane prediction"
                onError={() => setError('The prediction graphic could not be loaded.')}
                sx={{ display: 'block', width: '100%', mt: 2, borderRadius: 2 }}
              />
            )}
            {tab !== 0 && (
              <>
                <Stack direction="row" gap={2} sx={{ my: 2, flexWrap: 'wrap' }}>
                  {service.mode === 'demo' && (
                    <Button
                      color="inherit"
                      onClick={() => updateObservations(SAMPLE_OBSERVATIONS.map((p) => ({ ...p })))}
                    >
                      Load sample track
                    </Button>
                  )}
                  <Button
                    color="inherit"
                    disabled={!observations.length}
                    onClick={() =>
                      downloadFile(
                        'hurricane-observations.csv',
                        observationsCsv(observations),
                        'text/csv',
                      )
                    }
                  >
                    Export CSV
                  </Button>
                  <Button color="inherit" disabled={!observations.length} onClick={exportGraphic}>
                    Export map
                  </Button>
                </Stack>
                <TableContainer>
                  <Table size="small" aria-label="Hurricane observations">
                    <TableHead>
                      <TableRow>
                        {['Observation', 'Latitude', 'Longitude', 'Source', ''].map((label, i) => (
                          <TableCell key={i}>{label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {observations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>No observations yet.</TableCell>
                        </TableRow>
                      ) : (
                        observations.map((p, i) => (
                          <TableRow key={p.id}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>{p.latitude.toFixed(2)}°</TableCell>
                            <TableCell>{p.longitude.toFixed(2)}°</TableCell>
                            <TableCell sx={{ maxWidth: 200, overflowWrap: 'anywhere' }}>
                              {p.source}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                color="inherit"
                                aria-label={`Remove observation ${i + 1}`}
                                onClick={() =>
                                  updateObservations(observations.filter((o) => o.id !== p.id))
                                }
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
          <Paper sx={{ p: 3, alignSelf: 'start', minWidth: 0 }}>
            {tab === 0 ? (
              <Stack gap={2.5}>
                <Typography variant="h5">Eye detection</Typography>
                <Chip label={phaseLabels[phase]} size="small" sx={{ alignSelf: 'start' }} />
                <input
                  hidden
                  ref={input}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={upload}
                  disabled={busy}
                  aria-label="Upload hurricane image"
                />
                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={busy}
                  onClick={() => input.current?.click()}
                >
                  {image ? 'Replace image' : 'Choose image'}
                </Button>
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere', opacity: 0.7 }}>
                  {image?.name ?? 'No image selected'}
                </Typography>
                <Divider />
                <Typography variant="body2">Detected coordinates</Typography>
                <Stack direction="row" gap={3}>
                  {[
                    [
                      'Latitude',
                      location
                        ? `${Math.abs(location.latitude).toFixed(2)}° ${location.latitude < 0 ? 'S' : 'N'}`
                        : '—',
                    ],
                    [
                      'Longitude',
                      location
                        ? `${Math.abs(location.longitude).toFixed(2)}° ${location.longitude < 0 ? 'W' : 'E'}`
                        : '—',
                    ],
                  ].map(([label, value]) => (
                    <Box key={label}>
                      <Typography variant="caption">{label}</Typography>
                      <Typography variant="h4">{result ? value : '—'}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={!image || busy}
                  onClick={detect}
                >
                  {busy ? 'Analysing…' : result ? 'Run again' : 'Detect eye'}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={phase !== 'review' || !location}
                  onClick={addObservation}
                >
                  {phase === 'saved' ? 'Added to track' : 'Add to track'}
                </Button>
              </Stack>
            ) : tab === 1 ? (
              <Stack gap={2}>
                <Typography variant="h5">Track observations</Typography>
                <Typography variant="h3">{observations.length}</Typography>
                <Button
                  color="secondary"
                  variant="contained"
                  disabled={observations.length < 2 || pathWorking}
                  onClick={() => generatePath(false)}
                >
                  {pathWorking ? 'Building…' : 'Build track'}
                </Button>
                <Button color="inherit" onClick={() => setTab(0)}>
                  Add observation
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={observations.length < 2}
                  onClick={() => setTab(2)}
                >
                  Continue to prediction
                </Button>
                <Button
                  color="inherit"
                  disabled={!observations.length}
                  onClick={() => updateObservations([])}
                >
                  Clear observations
                </Button>
              </Stack>
            ) : (
              <Stack gap={2}>
                <Typography variant="h5">AI prediction</Typography>
                <TextField
                  label="Prompt"
                  multiline
                  minRows={7}
                  value={prompt}
                  onChange={(e) => {
                    pathRequest.current?.abort();
                    setPathWorking(false);
                    setPrediction(null);
                    setNotice('');
                    setPrompt(e.target.value);
                  }}
                  fullWidth
                />
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={observations.length < 2 || pathWorking}
                  onClick={() => generatePath(true)}
                >
                  {pathWorking ? 'Generating…' : 'Generate prediction'}
                </Button>
                {prediction?.assumptions?.map((assumption, index) => (
                  <Typography variant="body2" key={index}>
                    {assumption}
                  </Typography>
                ))}
                <Button
                  color="inherit"
                  disabled={!observations.length}
                  onClick={() => downloadFile('hurricane-prompt.txt', prompt, 'text/plain')}
                >
                  Export prompt
                </Button>
              </Stack>
            )}
            {(busy || pathWorking) && (
              <Button color="inherit" onClick={cancel} sx={{ mt: 2 }}>
                Cancel
              </Button>
            )}
          </Paper>
        </Box>
        <Typography role="status" variant="body2" sx={{ mt: 2, minHeight: 24, opacity: 0.7 }}>
          {notice}
        </Typography>
      </Box>
    </MainContentLayout>
  );
}
