# DATAD — Deployment Runbook

The app is two deployables: the **server** (Express API) and the **client** (static
Vite build). Recommended free-tier hosts: **Render** (server) + **Vercel** (client).
Everything below can be prepared now; the only blocker is choosing a domain.

## 0. One-time production setup (do before first deploy)

1. **MongoDB Atlas** — create a *new, separate* project + free M0 cluster for production.
   Get the connection string; create a DB user; allow network access from anywhere
   (0.0.0.0/0) or Render's IPs.
2. **Cloudinary** — create a *separate* account (or at least a dedicated folder) for prod.
   Note cloud name, API key, API secret.
3. **Brevo** — verify the sender email you'll send from; grab the API key.
4. **Secrets** — generate a fresh JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## 1. Deploy the server (Render)

1. New → **Web Service** → connect the GitHub repo → root directory `server`.
2. Build command: `npm install` · Start command: `npm start`.
3. Environment variables:
   ```
   PORT=10000                 # Render sets this; the app reads process.env.PORT
   CLIENT_URL=https://<your-domain>      # comma-separate if www + apex
   MONGODB_URI=<prod atlas uri>
   JWT_SECRET=<fresh 64-char hex>
   CLOUDINARY_CLOUD_NAME=<...>
   CLOUDINARY_API_KEY=<...>
   CLOUDINARY_API_SECRET=<...>
   BREVO_API_KEY=<...>
   MAIL_FROM=<verified sender>
   ADMIN_EMAIL=digitaldoncodes@gmail.com
   ```
4. Deploy. Confirm `GET https://<api-host>/api/health` returns `{"status":"ok"}`.

## 2. Deploy the client (Vercel)

1. New Project → import the repo → root directory `client`.
2. Framework preset: **Vite**. Build: `npm run build` · Output: `dist`.
3. Environment variable:
   ```
   VITE_API_BASE_URL=https://<api-host>/api
   ```
4. Deploy. Vercel gives a URL now; attach the custom domain once chosen.

## 3. Wire the domain (when the client picks one)

1. Point the domain's DNS at Vercel (client) per Vercel's instructions.
2. Update Render's `CLIENT_URL` to the final domain(s) and redeploy the server
   (CORS reads this).
3. If using both apex and www, list both in `CLIENT_URL` comma-separated.

## 4. First-run

1. **The admin registers first**: go to `/register` and sign up with
   `digitaldoncodes@gmail.com` — this account is auto-promoted to admin. Do this
   *before* sharing the link, so no one else can claim the admin email.
2. Verify: admin sees the **Admin** and **Journal** nav links; `/admin` loads.
3. Post a test announcement with "Email everyone" to confirm Brevo works.
4. Share the link with the batch.

## Local development

```bash
# server
cd server && npm install && cp .env.example .env   # fill values
npm run dev            # http://localhost:5001

# client
cd client && npm install && cp .env.example .env    # VITE_API_BASE_URL=http://localhost:5001/api
npm run dev            # http://localhost:5173
```

## Rollback

Both Render and Vercel keep previous deploys — use their dashboard "Rollback" to the
last good build. Data is unaffected (it lives in Atlas/Cloudinary).

## Post-deploy smoke test

- [ ] `/api/health` OK
- [ ] Register → welcome email arrives
- [ ] Login, create a note, upload a photo
- [ ] Finance income+expense, resume PDF export
- [ ] Admin announcement emails the batch
- [ ] Settings → change password, and (on a throwaway account) delete account
- [ ] `/privacy`, `/terms`, `/creator` load logged-out
