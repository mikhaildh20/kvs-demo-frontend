# Project Context — KVS Frontend

This frontend belongs to the KVS / Kanban Verification System project. The canonical full KVS context is in:

```txt
/opt/projects/kvs-demo-backend/docs/PROJECT_CONTEXT.md
```

Keep this context separate from Karsa Home, Portfolio, and Hermes Dashboard.

## Repo / Path

- Frontend repo: `mikhaildh20/kvs-demo-frontend`
- Backend repo: `mikhaildh20/kvs-demo-backend`
- Frontend path: `/opt/projects/kvs-demo-frontend`
- Backend path: `/opt/projects/kvs-demo-backend`

## Runtime

- Frontend service: `kvs-demo-frontend.service`
- Frontend internal port: `3001`
- Backend service: `kvs-demo-backend.service`
- Backend internal port: `5000`
- Runtime user: `kvsdemo`
- Reverse proxy: Nginx
- systemd runs `ExecStartPre=/usr/bin/npm run build` before `next start` so the service recovers if `.next` is missing after reboot/deploy.

## URLs

- Frontend: `https://kvs-demo.karsa-dev.my.id`
- API: `https://kvs-demo-api.karsa-dev.my.id`

## Env

- Real frontend env: `/opt/projects/kvs-demo-frontend/.env.local`
- Real backend env: `/opt/projects/kvs-demo-backend/.env`
- `.env.example` only contains safe placeholders.
- Never commit/display real env values.

## Frontend Notes

- Next.js app.
- API target must stay on KVS API domain.
- Brand/logo asset uses `/images/logoNLA.png`; do not switch back to `/images/logoKoito.png` unless explicitly requested.
- Visible KVS company/brand text should use `Nusantara Lighting Automotive` or NLA wording, not portfolio work-history company names.
- RBAC action buttons must be hidden when the current role lacks the required page path (`/pages/{module}/add`, `/detail`, `/edit`, `/print`).
- Toast messages should be English, consistent, and frontend-controlled for success messages; avoid relying on backend `response.message` for normal success wording.
- Auth cookie uses `sameSite: strict` and `secure` on HTTPS.
- Excel upload input accepts `.xlsx` only.
- Lint may have non-blocking warnings around `<img>`, ARIA combobox, and hook dependency.

## Verification Checklist

Before reporting frontend work as done:

1. `npm run lint`.
2. `npm run build`.
3. `systemctl is-active kvs-demo-frontend.service`.
4. Frontend login page returns HTTP 200.
5. API still works through `https://kvs-demo-api.karsa-dev.my.id`.
6. No real `.env.local` or secrets are staged/committed/printed.

## Boundary

If the user asks for Karsa Home changes, switch to `/opt/projects/karsa-home` and only modify Karsa Home/card data.
