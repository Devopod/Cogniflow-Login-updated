Drizzle Migration Consolidation Plan

1) Source of truth
- Drizzle ORM migrations in `migrations/` will be the single source of truth.

2) Preparation
- Ensure DATABASE_URL points to the correct database.
- Snapshot current schema: run `npm run db:push` if needed.

3) Prisma deprecation
- Stop generating/applying new Prisma migrations in `prisma/migrations/`.
- Keep existing SQL applied; do not delete historical files yet.

4) Custom TS migrations
- Move any outstanding logic into SQL/Drizzle migrations under `server/migrations` if needed, then deprecate TS scripts.

5) Validation
- Stand up a staging DB, apply Drizzle migrations from scratch, and verify app boots, reads/writes data.

6) Cleanup (final step)
- Once verified, remove `prisma/migrations/` and `server/migrations/*.ts` scripts from CI and docs.


