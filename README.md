# Location Tracker — React + TypeScript + Tailwind CSS

This rebuild includes the original home page, link generation, My Links page, visitor share page, and live-location view page.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173).
The API server runs at http://localhost:3002 and Vite proxies `/api` requests to it.

## Production build

```bash
npm run build
npm start
```

The Express server serves the production build and API on port 3001.

## Routes

- `/` — Generate a tracking link
- `/links` — Links saved in this browser
- `/t/:id` — Visitor page with explicit one-time location sharing and video
- `/view/:id` — Location dashboard with map and coordinates

## Important notes

- The visitor's browser prompts for location only after they click **Share my location**.
- If they decline, the video remains available using **Watch without sharing**.
- Coordinates are sent once to `POST /api/location` only after permission is granted.
- Geolocation requires HTTPS in production (localhost is permitted for development).
- The demo API stores links and location records in server memory. Restarting the server clears them. Use a persistent database and appropriate access controls before production deployment.
- Links saved under My Links are stored in the visitor/creator browser's local storage, so they are device-specific.


## Port conflict fix

The API server now defaults to port 3002 to avoid conflicts with another local
service already using port 3001. Vite proxies `/api` to port 3002.

If port 3002 is also occupied, set a different port before starting:

PowerShell:
```powershell
$env:PORT=3003
npm run dev
```

Then update `vite.config.ts` proxy target to `http://localhost:3003`.


## Share button behavior

On the visitor page, clicking **Share my location** starts the video and
requests the browser's native location permission at the same time. The browser
controls the permission prompt. Coordinates are sent only if the visitor
chooses Allow; if they choose Block, video playback continues but no location
is sent. Browsers may restrict autoplay with sound, so the video may initially
start muted or require the visitor to press the YouTube play control.
