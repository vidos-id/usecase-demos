# Bun monorepo server (JIT - no build step)
FROM oven/bun:1-alpine
WORKDIR /app

# Copy everything (client excluded via .dockerignore)
COPY . .

# Install only server + shared deps (skip client)
RUN bun install --frozen-lockfile --production --filter='!client'

USER bun
ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "server/src/index.ts"]
