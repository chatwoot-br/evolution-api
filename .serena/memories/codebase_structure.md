# Evolution API - Estrutura do Codebase

## Visão Geral da Estrutura

```
evolution-api/
├── src/                    # Código-fonte principal
├── prisma/                # Schemas e migrations do banco
├── openspec/              # Especificações OpenSpec
├── docs/                  # Documentação
├── charts/                # Helm charts para Kubernetes
├── Docker/                # Arquivos Docker adicionais
├── manager/               # Evolution Manager
├── evolution-manager-v2/  # Evolution Manager V2
├── public/                # Arquivos públicos estáticos
├── logs/                  # Logs da aplicação
├── .husky/                # Git hooks
├── .github/               # GitHub workflows
├── .cursor/               # Configurações Cursor IDE
├── .claude/               # Configurações Claude
├── .vscode/               # Configurações VS Code
└── Extras/                # Arquivos extras
```

## Estrutura de `src/` (Principal)

```
src/
├── main.ts                # Entry point da aplicação
├── @types/                # Definições de tipos TypeScript
│   └── express.d.ts       # Extensões Express
│
├── api/                   # Core da API
│   ├── server.module.ts   # Módulo principal do servidor
│   ├── controllers/       # HTTP route handlers (camada fina)
│   ├── services/          # Lógica de negócio (CORE)
│   ├── repository/        # Camada de acesso a dados (Prisma)
│   ├── routes/           # Definições de rotas Express
│   ├── dto/              # Data Transfer Objects
│   ├── guards/           # Autenticação/autorização middleware
│   ├── types/            # Tipos TypeScript específicos da API
│   ├── abstract/         # Classes abstratas base
│   ├── provider/         # Providers (sessions, etc.)
│   └── integrations/     # Integrações externas (MODULAR)
│
├── config/               # Configurações da aplicação
│   ├── env.config.ts     # Variáveis de ambiente
│   ├── path.config.ts    # Configurações de paths
│   ├── error.config.ts   # Configurações de erros
│   ├── logger.config.ts  # Configurações de logging
│   └── event.config.ts   # Configurações de eventos
│
├── cache/                # Implementações de cache
│   ├── cacheengine.ts    # Engine abstrato de cache
│   ├── rediscache.ts     # Implementação Redis
│   └── localcache.ts     # Implementação local (Node-cache)
│
├── exceptions/           # Custom HTTP exceptions
│   ├── 400.exception.ts
│   ├── 401.exception.ts
│   ├── 403.exception.ts
│   ├── 404.exception.ts
│   ├── 500.exception.ts
│   └── index.ts
│
├── utils/                # Utilitários e helpers
│   ├── translations/     # Arquivos i18n (pt-BR, en, es)
│   └── ...              # Diversos utilitários
│
└── validate/             # JSONSchema7 validation schemas
    ├── instance.schema.ts
    ├── message.schema.ts
    ├── group.schema.ts
    └── ...
```

## Estrutura de Integrations (src/api/integrations/)

### Channel Integrations (WhatsApp Providers)
```
src/api/integrations/channel/
├── channel.controller.ts    # Controller base
├── channel.router.ts        # Router base
├── whatsapp/               # Baileys (WhatsApp Web)
│   ├── whatsapp.baileys.service.ts
│   ├── baileys.controller.ts
│   ├── baileys.router.ts
│   ├── baileysMessage.processor.ts
│   └── voiceCalls/
├── meta/                   # Meta Business API
│   ├── whatsapp.business.service.ts
│   ├── meta.controller.ts
│   └── meta.router.ts
└── evolution/              # Evolution API
    ├── evolution.channel.service.ts
    ├── evolution.controller.ts
    └── evolution.router.ts
```

### Chatbot Integrations
```
src/api/integrations/chatbot/
├── chatbot.controller.ts    # Controller base
├── chatbot.router.ts        # Router base
├── chatbot.schema.ts        # Schema base
├── base-chatbot.dto.ts      # DTO base
├── base-chatbot.service.ts  # Service base
├── base-chatbot.controller.ts
├── chatwoot/               # Cada integração segue padrão:
│   ├── dto/                #   - dto/
│   ├── validate/           #   - validate/
│   ├── controllers/        #   - controllers/
│   ├── routes/            #   - routes/
│   ├── services/          #   - services/
│   ├── utils/ (opcional)  #   - utils/ (se necessário)
│   └── libs/ (opcional)   #   - libs/ (se necessário)
├── openai/
├── typebot/
├── dify/
├── flowise/
├── n8n/
├── evoai/
└── evolutionBot/
```

### Event Integrations
```
src/api/integrations/event/
├── event.controller.ts      # Controller base
├── event.router.ts          # Router base
├── event.schema.ts          # Schema base
├── event.dto.ts             # DTO base
├── event.manager.ts         # Event manager central
├── webhook/
│   ├── webhook.controller.ts
│   ├── webhook.router.ts
│   └── webhook.schema.ts
├── websocket/
├── rabbitmq/
├── sqs/
├── nats/
├── kafka/
└── pusher/
```

### Storage Integrations
```
src/api/integrations/storage/
├── storage.router.ts        # Router base
└── s3/
    ├── dto/
    ├── validate/
    ├── controllers/
    ├── routes/
    ├── services/
    └── libs/
        └── minio.server.ts
```

## Estrutura de Prisma

```
prisma/
├── postgresql-schema.prisma        # Schema PostgreSQL
├── mysql-schema.prisma             # Schema MySQL
├── postgresql-migrations/          # Migrations PostgreSQL
├── mysql-migrations/               # Migrations MySQL
└── migrations/                     # Temporário (copiado em runtime)
```

**Importante**: 
- `DATABASE_PROVIDER` env determina qual schema usar
- Scripts npm copiam migrations corretas para `prisma/migrations/`

## Arquivos de Configuração (Root)

```
├── package.json              # Dependências e scripts npm
├── tsconfig.json            # Configuração TypeScript
├── tsup.config.ts           # Configuração build (tsup)
├── .eslintrc.js             # Configuração ESLint
├── .eslintignore            # Arquivos ignorados pelo ESLint
├── .prettierrc.js           # Configuração Prettier
├── commitlint.config.js     # Configuração commitlint
├── .env.example             # Exemplo de variáveis de ambiente
├── Dockerfile               # Docker image principal
├── Dockerfile.metrics       # Docker image para métricas
├── docker-compose.yaml      # Compose para produção
├── docker-compose.dev.yaml  # Compose para desenvolvimento
├── CLAUDE.md                # Instruções para Claude AI
└── AGENTS.md                # Instruções para agentes AI
```

## Controllers, Services & Routes Pattern

### Controllers (src/api/controllers/)
Camada fina HTTP, apenas roteamento:
- `instance.controller.ts` - Gerenciamento de instâncias WhatsApp
- `sendMessage.controller.ts` - Envio de mensagens
- `group.controller.ts` - Operações de grupo
- `chat.controller.ts` - Operações de chat
- `label.controller.ts` - Labels/tags
- `business.controller.ts` - WhatsApp Business
- `template.controller.ts` - Message templates
- `settings.controller.ts` - Configurações
- `proxy.controller.ts` - Proxy settings
- `call.controller.ts` - Chamadas de voz
- `health.controller.ts` - Health checks

### Services (src/api/services/)
Lógica de negócio CORE:
- `channel.service.ts` - Gerenciamento de canais WhatsApp
- `auth.service.ts` - Autenticação
- `settings.service.ts` - Configurações
- `proxy.service.ts` - Proxy
- `template.service.ts` - Templates
- `monitor.service.ts` - Monitoramento
- `cache.service.ts` - Cache
- `bottleneck.service.ts` - Rate limiting

### Routes (src/api/routes/)
Definições de rotas Express (RouterBroker):
- `index.router.ts` - Router principal (agrega todos)
- `instance.router.ts`
- `sendMessage.router.ts`
- `group.router.ts`
- etc. (espelhando controllers)

### Guards (src/api/guards/)
Middleware de segurança:
- `auth.guard.ts` - Autenticação API key
- `instance.guard.ts` - Validação de instância
- `telemetry.guard.ts` - Telemetria

## DTOs (src/api/dto/)
Classes simples de transferência de dados:
- `instance.dto.ts`
- `sendMessage.dto.ts`
- `group.dto.ts`
- `chat.dto.ts`
- `label.dto.ts`
- `business.dto.ts`
- `chatbot.dto.ts`
- `settings.dto.ts`
- `proxy.dto.ts`
- `call.dto.ts`
- `template.dto.ts`

## Repository (src/api/repository/)
Camada de acesso a dados:
- `repository.service.ts` - Service principal de acesso ao Prisma

## Entry Point Flow

```
main.ts
  → api/server.module.ts (configura Express)
    → api/routes/index.router.ts (agrega todas rotas)
      → api/routes/*.router.ts (rotas específicas)
        → api/controllers/*.controller.ts (handlers)
          → api/services/*.service.ts (lógica de negócio)
            → api/repository/*.ts (acesso dados)
```

## Padrão de Integração

Cada integração externa segue estrutura modular consistente:
```
integration-name/
  ├── dto/              # Data Transfer Objects
  ├── validate/         # JSONSchema7 schemas
  ├── controllers/      # HTTP handlers
  ├── routes/          # Route definitions
  ├── services/        # Business logic
  ├── utils/ (opt)     # Utilities específicas
  └── libs/ (opt)      # Libraries externas
```

Este padrão facilita:
- Manutenção isolada
- Adição/remoção de integrações
- Reutilização de código base
- Testing modular
