# Hurricane task

The Hurricane page is available from the sidebar at `/hurricane`. It has three tabs: eye detection, hurricane tracking and AI prediction.

It currently runs in demo mode. Detection returns a sample result, and prediction extends the last movement by one step. No ML model is connected yet.

## Files

- `index.tsx`: page layout, image upload, results, observations and exports.
- `service.ts`: demo functions and backend requests.
- `model.ts`: observation types, saved data, prompt generation and CSV helpers.
- `land.ts`: world map outline from Natural Earth via world-atlas 2.0.2, public domain.
- `Hurricane.test.tsx`: page and observation tests.
- `service.test.ts`: backend request and response tests.
- `model.test.ts`: saved observation validation, prompts and CSV output.

## Running locally

Run `npm run dev`, then open `/hurricane`. Use `npm test` to run the tests and `npm run build` to check the production build. Run `npm run test:coverage` to generate the coverage report, then open `coverage/pages/Hurricane/index.html` for this feature. The report also includes the rest of the application.

To use a local backend, add the following to `.env.local` and restart Vite:

```dotenv
VITE_HURRICANE_MODE=backend
VITE_HURRICANE_API_URL=/hurricane-api
HURRICANE_BACKEND_URL=http://127.0.0.1:8200
```

Vite forwards `/hurricane-api` requests to the backend. This proxy is for local development; hosting would need a separate proxy or API URL. Do not put secrets in `VITE_*` variables.

## Backend interface

The page calls `detect`, `buildTrack` and `predict` through `HurricaneService`. The endpoints below are proposed formats for the backend. If the final API differs, update the adapter in `service.ts`.

### Detection

`POST /detect` receives the uploaded file as multipart data under `image`. The UI accepts PNG, JPEG and WebP files up to 15 MB.

```json
{
  "status": "found",
  "eye": { "x": 0.64, "y": 0.38 },
  "position": { "latitude": 22.3, "longitude": -65.4 },
  "confidence": 0.94,
  "model": "eye-detector-v1"
}
```

The eye coordinates range from 0 to 1 across the original displayed image, measured from the top-left corner. The backend must account for any resizing, cropping or rotation used by the model.

If geographic coordinates are unknown, return `position: null`. The UI can still mark the eye but will not add it to the geographic track. Return `{"status":"not_found"}` when no eye is found. Confidence and model name are optional.

### Tracking

`POST /track` receives `{"observations":[...]}`. Each observation contains an ID, latitude, longitude and source name. It can also include a timestamp, model name and method (`demo` or `backend`). Array order defines the observation order.

Return `{"points":[{"latitude":20,"longitude":-60}, ...]}`. Include timestamps where known. The UI displays this returned path and keeps the original observations in the table.

### Prediction

`POST /predict` receives `{"track":{"points":[...]},"prompt":"..."}`. The prompt includes the operator's edits.

Return forecast `points`, a `graphicUrl`, or both. An optional `assumptions` array contains text to display with the result. Graphic URLs must use HTTP(S); relative paths such as `assets/forecast.png` resolve under the API base URL. Export map saves the map as SVG, not the separately generated image.

### Longer jobs

An endpoint can return HTTP 202 with `{"jobId":"job-123"}`. The client then checks `GET /jobs/job-123` once per second. Job status must be `queued`, `running`, `succeeded` or `failed`.

A successful job includes its endpoint response in `result`. A failed job can include a `message`. The default timeout is 120 seconds. Cancel stops the browser request and polling; it does not stop the backend worker.

## Saved data and errors

Observations are stored in the browser under `bath-hurricane-observations-v1`. Images are not saved. Demo and backend observations are filtered by their method when loading the page. CSV exports identify which method produced each observation.

Changing an image clears its detection. Changing observations clears the track and prediction. Editing the prompt clears the prediction. Pending results are ignored after cancellation or when their inputs change.

Backend responses are checked before use. Failed requests show an error and can be retried; they never fall back to demo data.

The tests use mocked backend responses. Testing against the actual backend is still required once it is available. Video input, model training and authentication are not implemented.
