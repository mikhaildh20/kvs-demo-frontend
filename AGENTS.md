<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Notes — KVS Frontend

Always read `docs/PROJECT_CONTEXT.md` before making KVS frontend changes.

This repo is the frontend half of the KVS / Kanban Verification System project.
Keep this context separate from Karsa Home, Portfolio, and Hermes Dashboard.

Rules:

- API target is the KVS API domain, not Karsa Home or Portfolio.
- Do not commit `.env.local` or real secrets.
- Use `.env.example` for safe placeholders only.
- Keep auth cookie hardening unless there is a verified reason to change it.
- Keep Excel upload `.xlsx` only unless backend parser/security is updated first.
- Verify with `npm run lint`, `npm run build`, service status, and login page HTTP 200 before reporting success.
