# Configuration Standards

This directory stores environment profiles and cloud-agnostic runtime defaults.

## Layout

```txt
configs/
  env/
    base.env
    development.env
    staging.env
    production.env
```

## Loading order

The `@direct/config` package loads configuration in this order:

1. `configs/env/base.env`
2. `configs/env/<NODE_ENV>.env`
3. `CONFIG_ENV_FILE` (optional override)
4. `.env` (local private file)

Earlier values remain unless overridden by runtime environment variables from the platform.

## Rules

- No hardcoded credentials in source code.
- Production secrets must come from secret managers.
- Keep `.env` local and private.
- Track only sanitized templates in git.
