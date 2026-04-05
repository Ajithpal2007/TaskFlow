FROM node:20-alpine AS base
RUN apk update
RUN npm install -g pnpm turbo

# --------------------------------------------------------
# 1. PRUNE THE WORKSPACE
# --------------------------------------------------------
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune api --docker

# --------------------------------------------------------
# 2. INSTALL & BUILD
# --------------------------------------------------------
FROM base AS installer
WORKDIR /app

COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/full/packages/database/prisma ./packages/database/prisma

# Standard, clean, lightning-fast install.
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# Generate the custom local client
RUN DATABASE_URL="postgresql://dummy:password@localhost/db" pnpm exec prisma generate --schema=packages/database/prisma/schema.prisma

# Build the API
RUN DATABASE_URL="postgresql://dummy:password@localhost/db" pnpm turbo run build --filter=api...

# --------------------------------------------------------
# 3. RUNNER STAGE
# --------------------------------------------------------
FROM base AS runner
WORKDIR /app

# Because Prisma is now standard source code in "packages/database/generated", 
# it copies over perfectly with zero broken symlinks!
COPY --from=installer /app .

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]