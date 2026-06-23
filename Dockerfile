# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS server-deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

FROM node:20-bookworm-slim AS client-build
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm ci --legacy-peer-deps
COPY client ./client
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN cd client && npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3010

COPY . .
COPY --from=server-deps /app/node_modules ./node_modules
COPY --from=client-build /app/client/dist ./client/dist

RUN rm -rf client/node_modules \
  && mkdir -p logs sessions contacts conversations flow-json/nodes flow-json/edges client/public/media

EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3010;http.get('http://127.0.0.1:'+port+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
