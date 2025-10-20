# CLAUDE.md

This file provides comprehensive guidance to Claude AI when working with the Evolution API codebase.

## Project Overview

**Evolution API** is a powerful, production-ready REST API for WhatsApp communication that supports multiple WhatsApp providers:
- **Baileys** (WhatsApp Web) - Open-source WhatsApp Web client
- **Meta Business API** - Official WhatsApp Business API
- **Evolution API** - Custom WhatsApp integration

Built with **Node.js 20+**, **TypeScript 5+**, and **Express.js**, it provides extensive integrations with chatbots, CRM systems, and messaging platforms in a **multi-tenant architecture**.

## Common Development Commands

### Build and Run
```bash
# Development
npm run dev:server    # Run in development with hot reload (tsx watch)

# Production
npm run build        # TypeScript check + tsup build
npm run start:prod   # Run production build

# Direct execution
npm start           # Run with tsx
```

### Code Quality
```bash
npm run lint        # ESLint with auto-fix
npm run lint:check  # ESLint check only
npm run commit      # Interactive commit with commitizen
```

### Database Management
```bash
# Set database provider first
export DATABASE_PROVIDER=postgresql  # or mysql

# Generate Prisma client (automatically uses DATABASE_PROVIDER env)
npm run db:generate

# Deploy migrations (production)
npm run db:deploy      # Unix/Mac
npm run db:deploy:win  # Windows

# Development migrations (with sync to provider folder)
npm run db:migrate:dev      # Unix/Mac
npm run db:migrate:dev:win  # Windows

# Open Prisma Studio
npm run db:studio

# Development migrations
npm run db:migrate:dev      # Unix/Mac
npm run db:migrate:dev:win  # Windows
```

### Testing
```bash
npm test    # Run tests with watch mode
```

## Architecture Overview

### Core Structure
- **Multi-tenant SaaS**: Complete instance isolation with per-tenant authentication
- **Multi-provider database**: PostgreSQL and MySQL via Prisma ORM with provider-specific schemas and migrations
- **WhatsApp integrations**: Baileys, Meta Business API, and Evolution API with unified interface
- **Event-driven architecture**: EventEmitter2 for internal events + WebSocket, RabbitMQ, SQS, NATS, Pusher for external events
- **Microservices pattern**: Modular integrations for chatbots, storage, and external services

### Directory Layout
```
src/
├── api/
│   ├── controllers/     # HTTP route handlers (thin layer)
│   ├── services/        # Business logic (core functionality)
│   ├── repository/      # Data access layer (Prisma)
│   ├── dto/            # Data Transfer Objects (simple classes)
│   ├── guards/         # Authentication/authorization middleware
│   ├── integrations/   # External service integrations
│   │   ├── channel/    # WhatsApp providers (Baileys, Business API, Evolution)
│   │   ├── chatbot/    # AI/Bot integrations (OpenAI, Dify, Typebot, Chatwoot)
│   │   ├── event/      # Event systems (WebSocket, RabbitMQ, SQS, NATS, Pusher)
│   │   └── storage/    # File storage (S3, MinIO)
│   ├── routes/         # Express route definitions (RouterBroker pattern)
│   └── types/          # TypeScript type definitions
├── config/             # Environment and app configuration
├── cache/             # Redis and local cache implementations
├── exceptions/        # Custom HTTP exception classes
├── utils/            # Shared utilities and helpers
└── validate/         # JSONSchema7 validation schemas
```

### Key Integration Points

**Channel Integrations** (`src/api/integrations/channel/`):
- **Baileys**: WhatsApp Web client with QR code authentication
- **Business API**: Official Meta WhatsApp Business API
- **Evolution API**: Custom WhatsApp integration
- Connection lifecycle management per instance with automatic reconnection

**Chatbot Integrations** (`src/api/integrations/chatbot/`):
- **EvolutionBot**: Native chatbot with trigger system
- **Chatwoot**: Customer service platform integration
- **Typebot**: Visual chatbot flow builder
- **OpenAI**: AI capabilities including GPT and Whisper (audio transcription)
- **Dify**: AI agent workflow platform
- **Flowise**: LangChain visual builder
- **N8N**: Workflow automation platform
- **EvoAI**: Custom AI integration

**Event Integrations** (`src/api/integrations/event/`):
- **WebSocket**: Real-time Socket.io connections
- **RabbitMQ**: Message queue for async processing
- **Amazon SQS**: Cloud-based message queuing
- **NATS**: High-performance messaging system
- **Pusher**: Real-time push notifications

**Storage Integrations** (`src/api/integrations/storage/`):
- **AWS S3**: Cloud object storage
- **MinIO**: Self-hosted S3-compatible storage
- Media file management and URL generation

### Database Schema Management
- Separate schema files: `postgresql-schema.prisma` and `mysql-schema.prisma`
- Environment variable `DATABASE_PROVIDER` determines active database
- Migration folders are provider-specific and auto-selected during deployment

### Authentication & Security
- **API key-based authentication** via `apikey` header (global or per-instance)
- **Instance-specific tokens** for WhatsApp connection authentication
- **Guards system** for route protection and authorization
- **Input validation** using JSONSchema7 with RouterBroker `dataValidate`
- **Rate limiting** and security middleware
- **Webhook signature validation** for external integrations

## Important Implementation Details

### WhatsApp Instance Management
- Each WhatsApp connection is an "instance" with unique name
- Instance data stored in database with connection state
- Session persistence in database or file system (configurable)
- Automatic reconnection handling with exponential backoff

### Message Queue Architecture
- Supports RabbitMQ, Amazon SQS, and WebSocket for events
- Event types: message.received, message.sent, connection.update, etc.
- Configurable per instance which events to send

### Media Handling
- Local storage or S3/Minio for media files
- Automatic media download from WhatsApp
- Media URL generation for external access
- Support for audio transcription via OpenAI

### Multi-tenancy Support
- Instance isolation at database level
- Separate webhook configurations per instance
- Independent integration settings per instance

## Environment Configuration

Key environment variables are defined in `.env.example`. The system uses a strongly-typed configuration system via `src/config/env.config.ts`.

Critical configurations:
- `DATABASE_PROVIDER`: postgresql or mysql
- `DATABASE_CONNECTION_URI`: Database connection string
- `AUTHENTICATION_API_KEY`: Global API authentication
- `REDIS_ENABLED`: Enable Redis cache
- `RABBITMQ_ENABLED`/`SQS_ENABLED`: Message queue options

## Development Guidelines

The project follows comprehensive development standards defined in `.cursor/rules/`:

### Core Principles
- **Always respond in Portuguese (PT-BR)** for user communication
- **Follow established architecture patterns** (Service Layer, RouterBroker, etc.)
- **Robust error handling** with retry logic and graceful degradation
- **Multi-database compatibility** (PostgreSQL and MySQL)
- **Security-first approach** with input validation and rate limiting
- **Performance optimizations** with Redis caching and connection pooling

### Code Standards
- **TypeScript strict mode** with full type coverage
- **JSONSchema7** for input validation (not class-validator)
- **Conventional Commits** enforced by commitlint
- **ESLint + Prettier** for code formatting
- **Service Object pattern** for business logic
- **RouterBroker pattern** for route handling with `dataValidate`

### Architecture Patterns
- **Multi-tenant isolation** at database and instance level
- **Event-driven communication** with EventEmitter2
- **Microservices integration** pattern for external services
- **Connection pooling** and lifecycle management
- **Caching strategy** with Redis primary and Node-cache fallback

## AI Assistant Tools (MCP)

This project has MCP (Model Context Protocol) tools configured to assist in development. **ALWAYS use these tools to work more efficiently**.

### Serena MCP - Semantic Code Navigation

**REQUIRED**: Use Serena for code exploration and editing.

**Usage Principles**:
1. ✅ **USE symbolic tools FIRST** - Before reading complete files
2. ✅ **Read only what's necessary** - Use `include_body=True` only for specific symbols
3. ✅ **Overview first** - Use `get_symbols_overview` to understand structure
4. ❌ **NEVER read complete files** unnecessarily
5. ❌ **DO NOT repeat reads** of same content with different tools

**Main Tools**:
- `find_symbol` - Search symbols by name/pattern with type filters (class=5, function=12, method=6)
- `get_symbols_overview` - File structure without reading complete content
- `find_referencing_symbols` - Find where a symbol is used (change impact)
- `search_for_pattern` - Flexible regex search with context
- `replace_symbol_body` - Replace complete symbol definition
- `insert_after_symbol` / `insert_before_symbol` - Insert code at precise positions
- `list_dir` - List directories (respects gitignore)
- `read_file` - Read project files

**Exploration Workflow**:
```
1. list_dir / find_file → Locate relevant files
2. get_symbols_overview → Understand structure (WITHOUT reading content)
3. find_symbol → Locate specific symbol
4. include_body=True → Read ONLY necessary symbols
5. find_referencing_symbols → Assess impact (for changes)
```

**Editing Workflow**:
```
1. find_symbol → Locate symbol to edit
2. replace_symbol_body → Replace complete definition
   OR
   insert_after_symbol/insert_before_symbol → Add code
3. find_referencing_symbols → Check if breaks anything
```

**Available Memories** (use `list_memories` to see all):
- `project_overview.md` - Project overview
- `tech_stack.md` - Technologies used
- `code_style_and_conventions.md` - Patterns and conventions
- `suggested_commands.md` - Development commands
- `codebase_structure.md` - Directory structure
- `task_completion_checklist.md` - Task completion checklist

**Configuration**: `.serena/project.yml` (TypeScript, UTF-8, gitignore enabled)

### Context7 MCP - Library Documentation

**When to Use**: To query up-to-date documentation for external libraries

**Usage Flow**:
```typescript
// 1. Resolve library ID
resolve-library-id("baileys")

// 2. Get documentation with returned ID
get-library-docs("/whiskeysockets/baileys", topic: "sending messages")
```

**Common Project Libraries**:
- Express.js, Prisma, Socket.io, TypeScript, Node.js
- @whiskeysockets/baileys (search as "baileys")
- OpenAI SDK, axios, Redis client, Sentry, Pino
- RabbitMQ (amqplib), AWS SDK (S3, SQS), MinIO, Pusher

**Use Context7 for**:
- Verify correct API signatures
- Understand library parameters
- Confirm expected method behavior
- Check breaking changes in updates

### DeepWiki MCP - Repository Documentation

**When to Use**: To query specific documentation for Evolution API or Baileys

**Available Repositories**:

1. **EvolutionAPI/evolution-api** - This project's documentation
   - Architectural decisions
   - Development guides
   - Best practices
   - Integration patterns

2. **WhiskeySockets/Baileys** - WhatsApp Web client
   - Message sending API
   - Event handling
   - Authentication and sessions
   - Media handling

**Tools**:
- `read_wiki_structure(repo)` - List available topics
- `read_wiki_contents(repo)` - Complete documentation content
- `ask_question(repo, question)` - Specific query about repository

**Usage Examples**:
```typescript
// Understand multi-tenancy system
ask_question("EvolutionAPI/evolution-api", "How does instance isolation work?")

// How to send messages in Baileys
ask_question("WhiskeySockets/Baileys", "How to send media messages?")

// Explore available documentation
read_wiki_structure("WhiskeySockets/Baileys")
```

**Use DeepWiki for**:
- Understand Evolution API architectural patterns
- Consult technical decisions already made
- Check how to implement similar features
- Understand complete Baileys API

## Integrated Development Workflow

### 1. Exploring Existing Code
```
a) Serena list_dir → Find files
b) Serena get_symbols_overview → See structure WITHOUT reading
c) Serena find_symbol → Locate specific symbol
d) DeepWiki ask_question → Understand architectural decision (if needed)
```

### 2. Implementing New Feature
```
a) DeepWiki → Consult similar patterns in project
b) Serena find_symbol → See related implementations
c) Context7 → Verify library APIs to use
d) Serena replace_symbol_body / insert_* → Implement
e) Serena find_referencing_symbols → Check impact
```

### 3. Debugging / Fixing Issues
```
a) Serena search_for_pattern → Find related code
b) Serena get_symbols_overview → Understand context
c) Context7 → Verify correct library behavior
d) DeepWiki → Consult documentation to understand expectations
e) Serena replace_symbol_body → Apply fix
```

### 4. Creating OpenSpec Proposal
```
a) DeepWiki → Understand project patterns
b) Serena find_symbol → Explore related code
c) Context7 → Verify library APIs
d) Create proposal following openspec/AGENTS.md
```

## Tool Usage Rules

### Preference Order
1. **Serena MCP** - For any code operation (reading, searching, editing)
2. **Context7 MCP** - For external library documentation
3. **DeepWiki MCP** - For Evolution API or Baileys specific patterns
4. **Built-in tools** (Read, Glob, Grep) - ONLY if MCP not available

### When NOT to Use Built-in Tools
- ❌ DO NOT use `Read` if you can use Serena `read_file` or `get_symbols_overview`
- ❌ DO NOT use `Glob` if you can use Serena `list_dir` or `find_file`
- ❌ DO NOT use `Grep` if you can use Serena `search_for_pattern` or `find_symbol`
- ❌ DO NOT read complete files if you can use `get_symbols_overview` + `find_symbol`

### Required Optimizations
- ⚡ Use `get_symbols_overview` BEFORE any file read
- ⚡ Use `find_symbol` with type filters for precise searches
- ⚡ Use `include_body=False` first, then `True` only for necessary symbols
- ⚡ Use `relative_path` to restrict searches to specific directories
- ⚡ Consult memories with `read_memory` instead of re-exploring the project

## Testing Approach

Currently, the project has minimal formal testing infrastructure:
- **Manual testing** is the primary approach
- **Integration testing** in development environment
- **No unit test suite** currently implemented
- Test files can be placed in `test/` directory as `*.test.ts`
- Run `npm test` for watch mode development testing

### Recommended Testing Strategy
- Focus on **critical business logic** in services
- **Mock external dependencies** (WhatsApp APIs, databases)
- **Integration tests** for API endpoints
- **Manual testing** for WhatsApp connection flows

## Deployment Considerations

- Docker support with `Dockerfile` and `docker-compose.yaml`
- Graceful shutdown handling for connections
- Health check endpoints for monitoring
- Sentry integration for error tracking
- Telemetry for usage analytics (non-sensitive data only)

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->
