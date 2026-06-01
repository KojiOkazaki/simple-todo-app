# CareerBot backend image.
FROM node:22-alpine

WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

COPY backend/src ./src
# Brand assets (served at /logo.svg, used by the splash page).
COPY assets ../assets

ENV PORT=8080
EXPOSE 8080

# Basic healthcheck against /healthz.
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["node", "src/index.js"]
