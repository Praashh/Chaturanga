FROM oven/bun AS build

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Cache packages installation
COPY package.json ./
COPY bun.lock ./


COPY prisma ./prisma
COPY prisma.config.* ./

RUN bun install

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}


COPY ./src ./src

ENV NODE_ENV=production


RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --outfile server \
    src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000