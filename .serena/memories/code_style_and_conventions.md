# Evolution API - Code Style & Conventions

## TypeScript
- **Strict mode**: TypeScript strict mode OBRIGATÓRIO
- **Type coverage**: Cobertura completa de tipos
- **No implicit any**: Evitar uso de `any`, preferir tipos específicos
- **tsconfig.json**: Configuração centralizada para todo projeto

## Validation
- **JSONSchema7**: Usar para validação de input (PRIMÁRIO)
  - Schemas em `src/validate/*.schema.ts`
  - Usar com RouterBroker `dataValidate`
- **class-validator**: Presente no projeto mas JSONSchema7 é preferido
- **Input validation**: OBRIGATÓRIA para todos os endpoints

## Architecture Patterns

### Service Layer Pattern
```
Controllers (src/api/controllers/)
  → Camada fina HTTP, apenas roteamento
  → Não deve conter lógica de negócio

Services (src/api/services/)
  → Lógica de negócio CORE
  → Toda lógica importante vai aqui
  → Reutilizável e testável

Repository (src/api/repository/)
  → Camada de acesso a dados via Prisma
  → Abstração do banco de dados
```

### RouterBroker Pattern
- Definição de rotas em `src/api/routes/`
- Usar `dataValidate` para validação de input
- Guards para autenticação/autorização
- Exemplo:
```typescript
router.post(
  '/endpoint',
  dataValidate(MySchema),
  authGuard,
  controller.method
);
```

### Data Transfer Objects (DTOs)
- Classes simples em `src/api/dto/`
- Definem estrutura de dados entre camadas
- Não contêm lógica de negócio

### Guards System
- Middleware de autenticação/autorização em `src/api/guards/`
- `auth.guard.ts`: Autenticação por API key
- `instance.guard.ts`: Validação de instância
- `telemetry.guard.ts`: Coleta de telemetria

### Custom Exceptions
- HTTP exceptions em `src/exceptions/`
- 400, 401, 403, 404, 500 exceptions
- Usar para erros HTTP padronizados

## Integrations Pattern
Estrutura modular em `src/api/integrations/`:
```
integration-name/
  ├── dto/              # Data Transfer Objects
  ├── validate/         # JSONSchema7 schemas
  ├── controllers/      # HTTP handlers
  ├── routes/          # Route definitions
  ├── services/        # Business logic
  └── libs/ (opcional) # Libraries específicas
```

## Naming Conventions

### Arquivos
- **Controllers**: `*.controller.ts`
- **Services**: `*.service.ts`
- **Routes**: `*.router.ts`
- **DTOs**: `*.dto.ts`
- **Schemas**: `*.schema.ts`
- **Guards**: `*.guard.ts`
- **Types**: `*.types.ts`

### Classes & Interfaces
- **PascalCase**: Classes e Interfaces
- **Descritivo**: Nomes que descrevem propósito
- **Sufixos**: Controller, Service, Router, DTO conforme tipo

### Variáveis & Funções
- **camelCase**: Variáveis e funções
- **Descritivo**: Nomes claros e auto-explicativos
- **Constantes**: UPPER_SNAKE_CASE para constantes globais

### Imports
- **Organização**: Usar eslint-plugin-simple-import-sort
- **Ordem**: Built-in → External → Internal → Relative

## Error Handling
- **Try-catch**: Em código assíncrono
- **Express-async-errors**: Tratamento automático de erros assíncronos
- **Custom exceptions**: Para erros HTTP padronizados
- **Retry logic**: Com exponential backoff para operações externas
- **Graceful degradation**: Sistema deve continuar funcionando com falhas parciais

## Logging
- **Pino**: Logger de alta performance
- **Níveis**: debug, info, warn, error
- **NUNCA logar dados sensíveis**: Tokens, API keys, dados de sessão WhatsApp
- **Structured logging**: JSON format

## Security
- **Input validation**: OBRIGATÓRIA (JSONSchema7)
- **API key authentication**: Via header `apikey`
- **Rate limiting**: Implementado via bottleneck
- **Webhook signature validation**: Para integrações externas
- **Dados sensíveis**: NUNCA expor ou logar
- **Telemetria**: Apenas dados não-sensíveis

## Database
- **Multi-provider**: Código compatível com PostgreSQL E MySQL
- **Prisma ORM**: Abstração de banco de dados
- **Migrations**: Separadas por provider (postgresql-migrations/, mysql-migrations/)
- **Connection pooling**: OBRIGATÓRIO para performance

## Git Workflow
- **Branch naming**: `username/feature-name`
- **Conventional Commits**: `feat/fix/chore(scope): description`
  - Exemplos: `feat(baileys): add auto-reconnect`
  - `fix(api): resolve auth middleware`
  - `chore(deps): update baileys to 7.0.0-rc.6`
- **Commitizen**: Usar `npm run commit` para commits interativos
- **commitlint**: Validação automática de mensagens
- **SEM atribuição Claude**: Não adicionar "Co-Authored-By: Claude" nos commits

## Code Formatting
- **ESLint**: Linting com auto-fix (`npm run lint`)
- **Prettier**: Formatação automática (integrado com ESLint)
- **lint-staged**: Lint automático em staged files
- **Husky**: Git hooks para enforce qualidade

## Comments & Documentation
- **TSDoc**: Para documentação de APIs públicas
- **Inline comments**: Para lógica complexa apenas
- **Self-documenting code**: Preferir código claro a comentários
- **CLAUDE.md**: Documentação do projeto para AI assistants

## Comunicação
- **Português (PT-BR)**: Toda comunicação com usuário
- **Inglês**: Código, commits, comentários no código
- **Sem emojis**: Em commits ou código (convenção do projeto)

## Multi-tenancy
- **Isolamento**: Completo no nível do banco de dados
- **Instance-specific**: Configurações independentes por instância
- **Autenticação**: Global (API key) OU por instância (token)

## Testing (Estado Atual)
- **Manual testing**: Abordagem primária
- **Integration testing**: Em ambiente de desenvolvimento
- **Sem suite de testes unitários**: Atualmente
- **Estratégia futura**: Focar em lógica de negócio crítica nos services
