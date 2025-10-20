# Evolution API - Tech Stack

## Runtime & Linguagem
- **Node.js**: 20+ (obrigatório)
- **TypeScript**: 5+ com strict mode
- **tsx**: Execução TypeScript para desenvolvimento
- **tsup**: Bundler TypeScript para produção

## Framework Web
- **Express.js**: 4.x - Framework web principal
- **express-async-errors**: Tratamento de erros assíncronos
- **compression**: Compressão de respostas HTTP
- **cors**: Cross-Origin Resource Sharing
- **multer**: Upload de arquivos

## Database & ORM
- **Prisma ORM**: 6.x - Object-Relational Mapping com suporte multi-provider
- **PostgreSQL**: Banco de dados primário (via pg driver 8.x)
- **MySQL**: Banco de dados alternativo
- **Schemas separados**: `postgresql-schema.prisma` e `mysql-schema.prisma`
- **DATABASE_PROVIDER**: Variável de ambiente que determina qual banco usar

## Cache & Session
- **Redis**: 4.x - Cache primário (opcional mas recomendado)
- **Node-cache**: 5.x - Cache local como fallback
- **@adiwajshing/keyed-db**: Key-value database para sessões

## Message Queue & Events
- **EventEmitter2**: 6.x - Eventos internos
- **RabbitMQ** (amqplib 0.10.x): Message broker AMQP (opcional)
- **Amazon SQS** (@aws-sdk/client-sqs 3.x): Fila cloud AWS (opcional)
- **NATS**: 2.x - Sistema de mensagens de alta performance (opcional)
- **KafkaJS**: 2.x - Apache Kafka client (opcional)
- **Socket.io**: 4.x - WebSocket real-time (built-in)
- **Pusher**: 5.x - Push notifications (opcional)

## WhatsApp Integrations
- **baileys**: 7.0.0-rc.6 (@whiskeysockets/baileys) - Cliente WhatsApp Web
- **Meta WhatsApp Business API**: Integração via API oficial
- **Evolution API**: Integração proprietária customizada

## Chatbot & AI Platforms
- **OpenAI**: 4.x - GPT (conversação) + Whisper (transcrição de áudio)
- **@figuro/chatwoot-sdk**: 1.x - SDK Chatwoot para atendimento
- Integrações customizadas: Typebot, Dify, Flowise, N8N, EvoAI

## Storage & Media
- **AWS S3** (@aws-sdk/client-s3): Object storage cloud
- **MinIO**: 8.x - Object storage self-hosted S3-compatible
- **Sharp**: 0.34.x - Processamento de imagens
- **Jimp**: 1.x - Manipulação de imagens
- **FFmpeg** (@ffmpeg-installer/ffmpeg, fluent-ffmpeg): Processamento de áudio/vídeo
- **audio-decode**: Decodificação de áudio
- **mediainfo.js**: Informações de arquivos de mídia

## Utilities & Libraries
- **axios**: 1.x - HTTP client
- **dotenv**: 16.x - Environment variables
- **dayjs**: 1.x - Manipulação de datas
- **jsonwebtoken**: 9.x - JWT tokens
- **jsonschema**: 1.x - JSONSchema7 validation
- **qrcode** / **qrcode-terminal**: Geração de QR codes
- **uuid**: Geração de UUIDs
- **@paralleldrive/cuid2**: Geração de CUIDs
- **bottleneck**: 2.x - Rate limiting
- **node-cron**: 3.x - Agendamento de tarefas
- **rxjs**: 7.x - Reactive programming
- **mime** / **mime-types**: Detecção de MIME types
- **emoji-regex**: Processamento de emojis
- **link-preview-js**: Preview de links
- **i18next**: Internacionalização

## Proxy & Network
- **https-proxy-agent**: 7.x - HTTPS proxy
- **socks-proxy-agent**: 8.x - SOCKS proxy

## Monitoring & Observability
- **@sentry/node**: 10.x - Error tracking e performance monitoring
- **pino**: 9.x - Logger de alta performance
- **swagger-ui-express**: 5.x - Documentação API

## Development Tools
- **ESLint**: 8.x - Linting
  - @typescript-eslint/eslint-plugin
  - @typescript-eslint/parser
  - eslint-plugin-prettier
  - eslint-plugin-simple-import-sort
  - eslint-plugin-import
- **Prettier**: 3.x - Formatação de código
- **commitizen**: 4.x - Commits interativos
- **commitlint**: 19.x - Validação de mensagens de commit
- **husky**: 9.x - Git hooks
- **lint-staged**: 16.x - Lint em staged files
- **tsconfig-paths**: 4.x - Path mapping TypeScript

## Security & Validation
- **class-validator**: 0.14.x - Validação de classes (legado, prefer JSONSchema7)
- **jsonschema**: Validação de input (primário)
- **@hapi/boom**: HTTP error responses

## Docker & Deployment
- **Docker**: Suporte via Dockerfile e docker-compose.yaml
- **Kubernetes**: Helm charts disponíveis em `charts/`
- **Prometheus + Grafana**: Configurações de exemplo para métricas

## Sistema Operacional
- **Darwin** (macOS): Sistema de desenvolvimento principal
- Comandos Unix/Mac para scripts npm (bash)
- Windows: Scripts alternativos (db:deploy:win, db:migrate:dev:win)
