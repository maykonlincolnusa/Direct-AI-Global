# Scripts

Operational scripts for local validation and production readiness checks.

## Structure

```txt
scripts/
  db/
  load/
  check-readiness.ps1
```

## Commands

- `pwsh ./scripts/check-readiness.ps1`
- `node ./scripts/load/basic-load.mjs http://localhost:3000/health 100`
- `node ./scripts/db/create-indexes.mjs`
