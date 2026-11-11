# Pocket Option AI Screenshot Scanner

## What this project does
- Mobile-friendly page with Gallery screenshot upload.
- Sends the image to a Node.js backend.
- Backend calls the OpenAI Responses API with image input.
- Returns a cautious structured visual chart review: BUY / SELL / WAIT, evidence confidence, expiry suggestion and reasons.

## Important limitations
- This is screenshot interpretation, not a live market feed.
- The screenshot may be delayed, cropped, or missing indicators.
- Evidence confidence is NOT probability of winning.
- Never treat output as guaranteed or use it as the sole basis for a trade.
- This app does not log in to Pocket Option, place trades, or access account credentials.

## Run locally
1. Install Node.js 20 or newer.
2. In this folder run: `npm install`
3. Copy `.env.example` to `.env`.
4. Put your OpenAI API key in `.env` as `OPENAI_API_KEY=...`
5. Run: `npm start`
6. Open `http://localhost:3000`

## Deploy
Deploy this Node app to a Node-compatible host. Add `OPENAI_API_KEY` and `OPENAI_MODEL` as server environment variables in the host dashboard. Do NOT put the key in `public/index.html`, a browser JavaScript file, GitHub, or a public ZIP.
