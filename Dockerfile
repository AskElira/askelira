# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY bin/ bin/
COPY src/ src/
COPY config/ config/
COPY templates/ templates/
COPY public/ public/
COPY scripts/ scripts/

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/node_modules node_modules/
COPY --from=build /app/package.json package.json
COPY --from=build /app/bin bin/
COPY --from=build /app/src src/
COPY --from=build /app/config config/
COPY --from=build /app/templates templates/
COPY --from=build /app/public public/
COPY --from=build /app/scripts scripts/

ENV NODE_ENV=production

EXPOSE 3000 5678

CMD ["node", "bin/cli.js", "start"]
