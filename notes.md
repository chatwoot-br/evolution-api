# Getting Started

```bash
apt install httpie
```

```bash
pnpm install

cp .env.example .env
./Docker/scripts/generate_database.sh
./Docker/scripts/deploy_database.sh

pnpm dev:server
```

```bash
docker buildx build --load --platform linux/arm64 -t ghcr.io/chatwoot-br/evolution-api:next -f Dockerfile .
docker buildx build --push --platform linux/amd64,linux/arm64 -t ghcr.io/chatwoot-br/evolution-api:next -f Dockerfile .

docker buildx imagetools create \
  --tag ghcr.io/chatwoot-br/evolution-api:v2.3.5 \
  --tag ghcr.io/chatwoot-br/evolution-api:v2.3 \
  --tag ghcr.io/chatwoot-br/evolution-api:v2 \
  ghcr.io/chatwoot-br/evolution-api:next
```
