# routes

Pick one:

## Flat (by endpoint)

One file per route group. Good for small demos.

```
routes/
  hello.ts        # /hello
  auth.ts         # /auth/*
  uploads.ts      # /uploads/*
```

## Nested (by domain)

Group related endpoints under a folder. Good for multi-demo repo.

```
routes/
  hello/
    index.ts      # router for /hello
    schemas.ts    # optional route-local schemas
  auth/
    index.ts      # /auth/*
```

Rules:
- Each module exports a `Hono` instance (router) and is composed in `src/index.ts`.
- Keep I/O schemas in `shared/src/api/*` unless the schema is truly local.
