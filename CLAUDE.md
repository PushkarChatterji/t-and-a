# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Deployment

This project runs on **Vercel** — there is no local dev environment. All changes must be committed and pushed to GitHub; Vercel picks them up automatically.

Workflow for every change:
1. Edit code.
2. Run `npm run build` (type-check and build) to verify the change compiles — do this via the Bash tool.
3. Commit and push to `master`.

Do **not** instruct the user to run `npm run dev` or test anything locally.

## Commands

```bash
npm run build        # type-check + production build — run before every push
npm run lint         # ESLint
npm run seed:users   # seed dummy users into MongoDB (run once, remotely or via script)
npm run seed:questions  # seed questions from CSV into MongoDB
```

There is no test suite configured.

## Environment Variables

Configured in the Vercel project dashboard (not `.env.local`):
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — shared secret for access and refresh tokens
- `JWT_ACCESS_EXPIRY` (default `15m`) / `JWT_REFRESH_EXPIRY` (default `7d`)
- `ADAPTIVE_THRESHOLD` (default `5`) — "done" questions needed to advance difficulty
- `AUTO_LOGOFF_MINUTES` (default `120`)
- Nodemailer vars for email (verification, password reset)

## Architecture

### Auth flow
JWT-based with short-lived access tokens (cookie `accessToken`) and a refresh token (cookie `refreshToken`) stored in MongoDB `sessions`. On every page load `AuthContext` silently POSTs `/api/auth/refresh` to rehydrate the access token; the user profile is cached in `sessionStorage` under `ep_user` to avoid a spinner on repeat visits.

- API route protection: wrap handlers with `withAuth(handler, allowedRoles?)` from [lib/auth/middleware.ts](lib/auth/middleware.ts). Retrieve the decoded JWT inside the handler via `getRequestUser(req)`.
- Client-side protection: wrap page content with `<AuthGuard allowedRoles={[...]}>` from [components/auth/AuthGuard.tsx](components/auth/AuthGuard.tsx).

### Role model
Five roles defined in [lib/utils/constants.ts](lib/utils/constants.ts): `individual_student`, `school_student`, `teacher`, `management`, `admin`. School-affiliated users (`school_student`, `teacher`, `management`) carry a `schoolId` in their JWT payload and `UserProfile`.

### Data layer
All DB access goes through Mongoose models in [lib/db/models/](lib/db/models/). The singleton connection helper is [lib/db/connection.ts](lib/db/connection.ts) — call `await connectDB()` at the top of every API route.

Key models: `User`, `Question`, `QuestionList`, `StudentProgress`, `Class`, `School`, `Session`, `Subscription`, `ActivityLog`.

**Question fields use snake_case** (`edu_board`, `chapter_name`, `difficulty_level`, etc.) — this is intentional and matches the CSV import format.

### API response shape
All routes use helpers from [lib/utils/api-response.ts](lib/utils/api-response.ts): `ok()`, `created()`, `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `serverError()`. Always use these — never construct `NextResponse.json` by hand in route handlers.

### Adaptive learning engine
[lib/adaptive/engine.ts](lib/adaptive/engine.ts) selects the next question for a student. Difficulty progression: `Focus → Practice → Challenge`, advancing once the student accumulates `ADAPTIVE_THRESHOLD` "done" answers at the current level.

### Page layout
- Route groups: `(auth)` for login/signup/verify, `(dashboard)` for all authenticated views.
- The dashboard layout wraps pages in `AuthGuard` and renders the `Sidebar`.
- Sub-routes under `(dashboard)`: `student/`, `teacher/`, `management/`, `admin/` — each section is restricted to its matching role(s).

### Math rendering
Questions are rendered with KaTeX via `react-katex`. Question text from the DB may contain LaTeX markup.
