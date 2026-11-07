# Location Tracker — React + TypeScript + Tailwind CSS

The app includes link generation, My Links, a visitor share page, and a location dashboard.

## Run locally

```bash
npm install
netlify dev --port 8889
```

Open http://localhost:8889. Netlify Dev runs Vite and the Netlify Functions API together. Running Vite alone does not serve the API.

## Deploy on Netlify

Netlify builds the frontend with `npm run build`, publishes `dist`, and deploys the API from `netlify/functions`. Client-side routes are served through the SPA fallback in `netlify.toml`.

Links and location submissions persist in Netlify Database using the schema in `db/schema.ts`. Database provisioning and migrations happen automatically during deployment. To change the schema, update that file and generate a migration with `npx drizzle-kit generate --name descriptive_change_name`.

### Database provisioning limit

If deployment fails during database provisioning with `403 Forbidden` and `database limit reached`, the Netlify account has exhausted its database allowance. This happens before the application build and requires an account-level change:

1. In the Netlify dashboard, delete a database from another project only after confirming its data is no longer needed, or upgrade to a plan with a larger database allowance.
2. Retry the failed deployment for this project after capacity is available. Netlify can then provision the database and apply the existing migrations automatically.

Keep `netlify/database/migrations` in the repository. The API needs these tables to create links, store location submissions, and display location history; removing the migrations would break those features. Retrying without freeing capacity or increasing the allowance does not resolve this error.

## Routes

- `/` — Generate a tracking link
- `/links` — Links saved in this browser
- `/t/:id` — Visitor page with explicit one-time location sharing and video
- `/view/:id` — Location dashboard with map and coordinates

## Location sharing

The visitor's browser prompts for location only after they click **Share my location**. Coordinates are sent once to `POST /api/location` only after permission is granted. Video playback remains available if permission is declined. Geolocation requires HTTPS in production; localhost is permitted for development.

The My Links list remains device-specific and is saved in browser local storage. Link records and location submissions are stored in the database. Anyone with a link ID can access its location dashboard, so share dashboard URLs only with intended recipients.
