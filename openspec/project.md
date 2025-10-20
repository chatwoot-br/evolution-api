# Project Context

## Purpose
Evolution API é uma REST API de produção para comunicação WhatsApp que suporta múltiplos provedores:
- **Baileys** (WhatsApp Web) - Cliente open-source do WhatsApp Web
- **Meta Business API** - API oficial do WhatsApp Business
- **Evolution API** - Integração WhatsApp customizada

Fornece integrações extensivas com chatbots, sistemas CRM e plataformas de mensagens em uma **arquitetura multi-tenant**, permitindo gerenciamento de múltiplas instâncias WhatsApp isoladas com autenticação por instância.

## Tech Stack
### Core
- **Node.js 20+** - Runtime JavaScript
- **TypeScript 5+** - Linguagem com tipagem estática
- **Express.js** - Framework web
- **tsx** - Execução TypeScript para desenvolvimento

### Database
- **Prisma ORM** - Object-Relational Mapping com suporte multi-provider
- **PostgreSQL** - Banco de dados primário
- **MySQL** - Banco de dados alternativo
- Schemas separados: `postgresql-schema.prisma` e `mysql-schema.prisma`

### Cache & Messaging
- **Redis** - Cache primário (opcional)
- **Node-cache** - Cache local fallback
- **RabbitMQ** - Fila de mensagens assíncronas (opcional)
- **Amazon SQS** - Fila de mensagens cloud (opcional)
- **NATS** - Sistema de mensagens de alta performance (opcional)
- **WebSocket (Socket.io)** - Comunicação em tempo real

### WhatsApp Integrations
- **@whiskeysockets/baileys** - Cliente WhatsApp Web
- **Meta WhatsApp Business API** - API oficial Meta
- **Evolution API** - Integração customizada

### External Integrations
- **Chatbots**: OpenAI (GPT + Whisper), Chatwoot, Typebot, Dify, Flowise, N8N, EvoAI
- **Storage**: AWS S3, MinIO
- **Monitoring**: Sentry (error tracking), Telemetry (analytics)
- **Push**: Pusher (notificações em tempo real)

### Development Tools
- **ESLint** - Linting com auto-fix
- **Prettier** - Formatação de código
- **commitizen** - Commits interativos
- **commitlint** - Validação de mensagens de commit
- **tsup** - Bundler TypeScript para produção

## Project Conventions

### Code Style
- **TypeScript strict mode** com cobertura completa de tipos
- **JSONSchema7** para validação de input (NÃO usar class-validator)
- **ESLint + Prettier** para formatação automática
- **Conventional Commits** enforçado por commitlint
- **Responder sempre em Português (PT-BR)** para comunicação com usuário
- **Sem emojis em commits ou código** (convenção do projeto)
- **Service Object pattern** para lógica de negócio
- **RouterBroker pattern** para definição de rotas com `dataValidate`
- **Data Transfer Objects (DTOs)** como classes simples em `src/api/dto/`
- **Guards** para autenticação/autorização em `src/api/guards/`
- **Custom exceptions** em `src/exceptions/` para tratamento de erros HTTP

### Architecture Patterns
#### Multi-tenant SaaS
- Isolamento completo de instâncias no nível do banco de dados
- Autenticação por instância com tokens únicos
- Configurações independentes de webhook e integrações por instância

#### Camadas de Aplicação
```
Controllers (src/api/controllers/)
  → Camada fina HTTP, apenas roteamento
Services (src/api/services/)
  → Lógica de negócio core
Repository (src/api/repository/)
  → Camada de acesso a dados via Prisma
```

#### Event-Driven Architecture
- **EventEmitter2** para eventos internos
- **WebSocket, RabbitMQ, SQS, NATS, Pusher** para eventos externos
- Tipos de eventos: `message.received`, `message.sent`, `connection.update`, etc.
- Configurável por instância quais eventos enviar

#### Microservices Pattern
- **Integrations modulares** em `src/api/integrations/`:
  - `channel/` - Provedores WhatsApp (Baileys, Business API, Evolution)
  - `chatbot/` - Integrações AI/Bot (OpenAI, Dify, Typebot, Chatwoot, etc.)
  - `event/` - Sistemas de eventos (WebSocket, RabbitMQ, SQS, NATS, Pusher)
  - `storage/` - Armazenamento de arquivos (S3, MinIO)

#### Connection Lifecycle Management
- Gerenciamento de conexões WhatsApp por instância
- Reconexão automática com exponential backoff
- Persistência de sessão no banco ou sistema de arquivos (configurável)
- Estado de conexão armazenado no banco de dados

#### Caching Strategy
- **Redis** como cache primário (opcional)
- **Node-cache** como fallback local
- Connection pooling para otimização de performance

### Testing Strategy
#### Estado Atual
- **Teste manual** é a abordagem primária
- **Testes de integração** em ambiente de desenvolvimento
- **Sem suite de testes unitários** atualmente implementada
- Arquivos de teste podem ser colocados em `test/` como `*.test.ts`
- Executar `npm test` para modo watch de desenvolvimento

#### Estratégia Recomendada
- Focar em **lógica de negócio crítica** nos services
- **Mock de dependências externas** (APIs WhatsApp, databases)
- **Testes de integração** para endpoints da API
- **Testes manuais** para fluxos de conexão WhatsApp

### Git Workflow
- **Branch principal**: `next` (usar para PRs)
- **Branch atual**: `release/v2.3.5`
- **Naming de feature branches**: `username/feature-name`
- **Conventional Commits**: `feat/fix/chore(scope): description`
  - Exemplos: `feat(baileys): add auto-reconnect`, `fix(api): resolve auth middleware`
- **Sem atribuição Claude em commits** (por convenção do usuário)
- **commitizen**: Usar `npm run commit` para commits interativos
- **commitlint**: Validação automática de mensagens de commit

## Domain Context
### WhatsApp Instance Management
- Cada conexão WhatsApp é uma "instance" com nome único
- Dados da instância armazenados no banco com estado da conexão
- Cada instância tem configurações independentes de:
  - Webhooks
  - Integrações de chatbot
  - Sistemas de eventos
  - Armazenamento de mídia

### Message Queue Architecture
- Suporta múltiplos sistemas de fila: RabbitMQ, Amazon SQS, WebSocket
- Eventos configuráveis por instância
- Processamento assíncrono de mensagens
- Retry logic com exponential backoff

### Media Handling
- Armazenamento local ou S3/MinIO para arquivos de mídia
- Download automático de mídia do WhatsApp
- Geração de URLs de mídia para acesso externo
- Suporte para transcrição de áudio via OpenAI Whisper

### Authentication & Security
- **Autenticação baseada em API key** via header `apikey` (global ou por instância)
- **Tokens específicos por instância** para autenticação de conexão WhatsApp
- **Sistema de Guards** para proteção de rotas e autorização
- **Validação de input** usando JSONSchema7 com RouterBroker `dataValidate`
- **Rate limiting** e middleware de segurança
- **Validação de assinatura de webhook** para integrações externas

### Multi-database Support
- Variável de ambiente `DATABASE_PROVIDER` determina banco ativo (postgresql ou mysql)
- Schemas separados: `postgresql-schema.prisma` e `mysql-schema.prisma`
- Pastas de migration específicas por provider (auto-selecionadas no deploy)
- Comandos npm configurados para sincronizar migrations entre providers

## Important Constraints
### Técnicas
- **Node.js 20+** obrigatório para compatibilidade
- **TypeScript 5+** com strict mode
- **Multi-database**: Código deve ser compatível com PostgreSQL E MySQL
- **Suporte multi-provider WhatsApp**: Manter interface unificada entre Baileys, Business API e Evolution API

### Segurança
- **Security-first approach**: Validação de input obrigatória
- **Dados sensíveis**: Nunca logar ou expor tokens, API keys ou dados de sessão WhatsApp
- **Telemetria**: Apenas dados não-sensíveis para analytics

### Performance
- **Connection pooling** obrigatório para databases
- **Caching strategy**: Redis preferencial, fallback para Node-cache
- **Graceful shutdown**: Tratamento adequado de desligamento para conexões ativas

### Operacionais
- **Docker support**: Manter `Dockerfile` e `docker-compose.yaml` funcionais
- **Health checks**: Endpoints de monitoramento devem estar sempre disponíveis
- **Error tracking**: Integração Sentry para rastreamento de erros em produção

## External Dependencies
### WhatsApp Providers (Critical)
- **@whiskeysockets/baileys** - Cliente WhatsApp Web open-source
- **Meta WhatsApp Business API** - API oficial Meta (requer conta Business)
- **Evolution API** - Integração customizada proprietária

### Chatbot Platforms
- **OpenAI API** - GPT (conversação) + Whisper (transcrição de áudio)
- **Chatwoot** - Plataforma de atendimento ao cliente
- **Typebot** - Construtor visual de fluxos de chatbot
- **Dify** - Plataforma de workflows de agentes AI
- **Flowise** - Construtor visual LangChain
- **N8N** - Plataforma de automação de workflows
- **EvoAI** - Integração AI customizada

### Event Systems
- **RabbitMQ** - Message broker AMQP (opcional)
- **Amazon SQS** - Serviço de fila cloud AWS (opcional)
- **NATS** - Sistema de mensagens de alta performance (opcional)
- **Pusher** - Notificações push em tempo real (opcional)
- **Socket.io** - WebSocket server (built-in)

### Storage Services
- **AWS S3** - Object storage cloud (opcional)
- **MinIO** - Object storage self-hosted S3-compatible (opcional)
- Sistema de arquivos local (fallback)

### Infrastructure
- **Redis** - Cache e session store (opcional mas recomendado)
- **Sentry** - Error tracking e monitoring (opcional)
- **PostgreSQL / MySQL** - Database (obrigatório um dos dois)

### Observabilidade
- **Telemetry** - Analytics de uso interno
- **Sentry** - Rastreamento de erros e performance
- **Health check endpoints** - Monitoramento de status da API

## AI Assistant Tools (MCP)

This project is configured with MCP (Model Context Protocol) tools to assist AI in development. Use these tools to work more efficiently with the codebase.

### Serena MCP - Semantic Code Navigation
**When to use**: For intelligent and efficient code exploration and editing

Main tools available:
- **`find_symbol`** - Search symbols (classes, functions, methods) by name or pattern
- **`get_symbols_overview`** - Top-level symbol overview of a file
- **`find_referencing_symbols`** - Find references to a specific symbol
- **`search_for_pattern`** - Flexible regex search in codebase
- **`replace_symbol_body`** - Replace symbol body (method, class, function)
- **`insert_after_symbol`** / **`insert_before_symbol`** - Insert code at specific positions
- **`list_dir`** - List directories and files (with recursion)
- **`read_file`** - Read project files
- **Memory tools** - `write_memory`, `read_memory`, `list_memories` for persistent context

**Usage principles**:
- ✅ Use symbolic tools BEFORE reading complete files
- ✅ Read only the necessary code for the task
- ✅ Use `get_symbols_overview` to understand file structure
- ✅ Use `find_symbol` with type filters for precise searches
- ❌ AVOID reading entire files unnecessarily
- ❌ DO NOT read the same content multiple times with different tools

**Configuration**: `.serena/project.yml`
- Language: TypeScript
- Encoding: UTF-8
- Git ignore: Enabled
- Read-only: Disabled (editing allowed)

### Context7 MCP - Library Documentation
**When to use**: To query up-to-date documentation for libraries and frameworks

Available tools:
- **`resolve-library-id`** - Resolve library name to Context7-compatible ID
- **`get-library-docs`** - Get up-to-date library documentation

**Usage flow**:
1. First use `resolve-library-id` with the library name
2. Use the returned ID with `get-library-docs` to get documentation

**Example libraries in project**:
- Express.js, Prisma, Socket.io, TypeScript, Node.js
- @whiskeysockets/baileys (use "baileys" as search term)
- OpenAI SDK, axios, Redis client

### DeepWiki MCP - Repository Documentation
**When to use**: To query specific documentation for Evolution API or Baileys

Available repositories:
- **`EvolutionAPI/evolution-api`** - This project's documentation
  - Use to understand architectural decisions
  - Consult development guides
  - Check project best practices

- **`WhiskeySockets/Baileys`** - WhatsApp Web client documentation
  - Use to understand Baileys API
  - Consult message sending methods
  - Check WhatsApp event handling

Available tools:
- **`read_wiki_structure`** - List available documentation topics
- **`read_wiki_contents`** - View complete documentation content
- **`ask_question`** - Ask specific questions about the repository

**Usage examples**:
```typescript
// Understand how Baileys handles messages
ask_question("WhiskeySockets/Baileys", "How to send media messages?")

// Query Evolution API architecture
read_wiki_structure("EvolutionAPI/evolution-api")
ask_question("EvolutionAPI/evolution-api", "How does the multi-tenancy system work?")
```

## Recommended Workflow for AI Assistants

### For Code Exploration
1. Use `list_dir` or `find_file` (Serena) to locate relevant files
2. Use `get_symbols_overview` (Serena) to understand file structure
3. Use `find_symbol` (Serena) to locate specific symbols
4. Read only necessary symbols with `include_body=True`

### For Documentation Query
1. External libraries → Context7 (`resolve-library-id` + `get-library-docs`)
2. Evolution API or Baileys → DeepWiki (`ask_question` or `read_wiki_contents`)
3. Project conventions → Read CLAUDE.md, openspec/project.md files

### For Code Editing
1. Locate symbols with `find_symbol` (Serena)
2. Use `replace_symbol_body` to replace complete definitions
3. Use `insert_after_symbol`/`insert_before_symbol` to add code
4. Check references with `find_referencing_symbols` before breaking changes

### For Feature Planning (OpenSpec)
1. Consult DeepWiki to understand existing patterns
2. Use Serena to explore related code
3. Use Context7 to verify library APIs
4. Create proposal following OpenSpec format in `openspec/AGENTS.md`
