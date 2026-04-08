# MongoDB migrations

Use timestamped migration files:

```txt
scripts/db/migrations/
  20260401_add_sales_indexes.mjs
```

Each migration should export:

- `up(client: MongoClient): Promise<void>`
- `down(client: MongoClient): Promise<void>`

Recommended execution strategy:

1. run in staging first
2. back up before production
3. record applied migrations in `direct-core.migrations`
