# Public Deployment

## Recommended

Use Render or Railway. This app is a single Node service that serves:

- static frontend from `public/`
- API endpoints from `server.js`

## Required environment variables

Set these in the hosting platform:

```env
DASHSCOPE_API_KEY=...
TEXT_PROVIDER=qwen
VISION_PROVIDER=qwen
IMAGE_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.quickrouter.ai/v1
OPENAI_IMAGE_MODEL=gpt-image-2
PORT=3000
```

Optional:

```env
REFERENCE_VIDEO_PATH=
EXTERNAL_REQUEST_TIMEOUT_MS=20000
```

On cloud hosting, leave `REFERENCE_VIDEO_PATH` empty unless you also upload that file into the container or a mounted disk.

## Render

1. Push this repo to GitHub.
2. In Render, create a new `Web Service`.
3. Connect the repo.
4. Render will detect `render.yaml`.
5. Add the environment variables above.
6. Deploy.

Health check:

```text
/healthz
```

## Railway

1. Push this repo to GitHub.
2. In Railway, create `New Project -> Deploy from GitHub repo`.
3. Add the environment variables above.
4. Deploy using the included `Dockerfile`.

## Notes

- `public/index.html` and `server.js` are served by the same process, so no extra reverse proxy is required.
- The local `/reference-video` route now fails gracefully with `404` when the referenced local file is unavailable.
