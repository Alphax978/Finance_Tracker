# Contributing

## Branching model

- `main` — production. Deploys live to [financetracker.blog](https://financetracker.blog).
- `staging` — pre-production. Deploys to a separate Vercel staging environment for
  manual QA before anything reaches `main`.
- Everything else — feature/fix branches, one per ticket, branched off `main`:
  `feature/<short-description>`, `fix/<short-description>`, `chore/<short-description>`.

Flow: feature branch → PR into `staging` → test on the real staging URL → PR
`staging` into `main` → production.

Never commit directly to `staging` or `main`. Even small changes go through a
feature branch and a PR — CI only runs on PRs and on pushes to `main`/`staging`,
so a direct commit skips review and lands unchecked.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `type: summary`.

Common types: `feat`, `fix`, `chore`, `docs`, `style` (formatting, not CSS),
`refactor`, `perf`, `test`, `build`, `ci`, `revert`.

## Pull requests

Every PR uses the template in `.github/PULL_REQUEST_TEMPLATE.md` — fill in what
changed, how it was tested, and screenshots for UI changes. An empty description
makes a PR much harder to review later; write one even for small changes.

CI (`.github/workflows/ci.yml`) runs automatically on every PR:
- **frontend**: lint, build, test
- **backend**: build only — no lint config or test suite yet, so this is the
  only automated check backend code currently gets

A red CI run should be fixed before merge, not merged past.

## Local development

Two ways to run the backend locally:

**Option A — Docker (recommended, no Atlas dependency):**
```
docker compose up
```
Boots the backend plus a local MongoDB container. Requires `backend/.env` to
exist (copy from `backend/.env.example`) — `MONGO_URI` in that file is
overridden automatically by `docker-compose.yml` to point at the local
Mongo container, so it doesn't matter what it's set to for this path.

**Option B — native, against a real MongoDB (e.g. Atlas):**
```
cd backend && npm run dev
```
Requires a real `MONGO_URI` in `backend/.env`.

Frontend, either way:
```
cd frontend/finance_tracker && npm run dev
```

See `backend/.env.example` and `frontend/finance_tracker/.env.example` for the
full list of required environment variables and where to get each one.

## Environments and keys

Clerk **live** keys (`pk_live_`/`sk_live_`) are domain-locked to
`financetracker.blog` and will not work on `localhost` or a Vercel preview
URL. Local dev and the `staging` Vercel environment use Clerk **test**
keys (`pk_test_`/`sk_test_`) instead, which aren't domain-locked. Frontend
and backend must use matching Clerk instances (both live, or both test) —
a test-keyed frontend token will fail verification against a live-keyed
backend, and vice versa.

Stripe currently runs on a single test-mode key (`sk_test_`) everywhere —
no live/test split needed yet since there's no live key in use.

## Known gaps (not hidden, just not fixed yet)

- Staging and production share the same MongoDB database, isolated only by
  Clerk user ID (test-instance users vs. live-instance users), not by
  database. Test data on staging lands in the real production database.
- Backend has no lint config and no automated tests.
