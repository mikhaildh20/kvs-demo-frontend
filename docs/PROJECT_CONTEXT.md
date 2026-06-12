# Project Context — KVS / Kanban Verification System

This frontend belongs to the same KVS project context as the backend.

Canonical context file:

- Backend repo copy: `/opt/projects/kvs-demo-backend/docs/PROJECT_CONTEXT.md`
- Frontend repo copy: `/opt/projects/kvs-demo-frontend/docs/PROJECT_CONTEXT.md`

## Scope

KVS stands for Kanban Verification System. Keep this context separate from Karsa Home, Portfolio, and Hermes Dashboard.

## Repositories and Paths

- Frontend repo: `mikhaildh20/kvs-demo-frontend`
- Backend repo: `mikhaildh20/kvs-demo-backend`
- Frontend path: `/opt/projects/kvs-demo-frontend`
- Backend path: `/opt/projects/kvs-demo-backend`

## Runtime

- Frontend service: `kvs-demo-frontend.service`
- Backend service: `kvs-demo-backend.service`
- Frontend internal port: `3001`
- Backend internal port: `5000`
- Runtime user: `kvsdemo`
- Reverse proxy: Nginx

## URLs

- Frontend: `https://kvs-demo.karsa-dev.my.id`
- API: `https://kvs-demo-api.karsa-dev.my.id`

## Env

- Real frontend env: `/opt/projects/kvs-demo-frontend/.env.local`
- Real backend env: `/opt/projects/kvs-demo-backend/.env`
- Never commit/display real env values.
- `.env.example` must use safe placeholders.

## Frontend Notes

- Next.js app.
- Auth cookie uses `sameSite: strict` and `secure` on HTTPS.
- Excel upload input accepts `.xlsx` only.
- Lint currently may have non-blocking warnings around `<img>`, ARIA combobox, and hook dependency.

## Verification

Before reporting frontend work as done:

1. `npm run lint`
2. `npm run build`
3. `systemctl is-active kvs-demo-frontend.service`
4. `curl https://kvs-demo.karsa-dev.my.id/pages/auth/login` returns HTTP 200
5. Confirm API still works through `https://kvs-demo-api.karsa-dev.my.id`

## Boundary

If the user asks for Karsa Home changes, switch context to `/opt/projects/karsa-home` and do not modify KVS unless linking to it.
