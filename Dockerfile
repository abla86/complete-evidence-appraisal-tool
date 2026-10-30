FROM node:22-alpine AS builder
WORKDIR /app

# Public, build-time values embedded in the client (never put secrets in VITE_ variables).
ARG VITE_LICENSE_PUBLIC_KEY=""
ARG VITE_SELLER_EMAIL=""
ARG VITE_SELLER_VAT_REGISTERED=""
ARG VITE_PUBLIC_SITE_URL=""
ENV VITE_LICENSE_PUBLIC_KEY=$VITE_LICENSE_PUBLIC_KEY \
    VITE_SELLER_EMAIL=$VITE_SELLER_EMAIL \
    VITE_SELLER_VAT_REGISTERED=$VITE_SELLER_VAT_REGISTERED \
    VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0
ENV EVIDENCE_DATA_DIR=/app/data
ENV NODE_OPTIONS=--disable-proto=throw

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder /app/dist ./dist
# Licensed download of the offline edition (served only to holders of a download licence).
COPY --from=builder /app/release ./release

RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '10000') + '/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" # DevSkim: ignore DS137138

CMD ["node", "dist/server.cjs"]
