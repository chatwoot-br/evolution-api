# Evolution API - Task Completion Checklist

Esta checklist deve ser seguida quando uma tarefa de desenvolvimento é concluída.

## 1. Code Quality

### Linting & Formatação
```bash
npm run lint         # Auto-fix de problemas ESLint/Prettier
```

**Verificar**:
- ✅ Nenhum erro de lint
- ✅ Código formatado com Prettier
- ✅ Imports organizados (simple-import-sort)
- ✅ Sem warnings críticos

### TypeScript
```bash
npm run build        # TypeScript check + build
```

**Verificar**:
- ✅ Sem erros de TypeScript
- ✅ Todos os tipos definidos (sem `any` implícito)
- ✅ Build completa com sucesso
- ✅ Dist/ gerado corretamente

## 2. Validation & Security

### Input Validation
**Verificar**:
- ✅ Todos endpoints têm validação JSONSchema7
- ✅ Schemas definidos em `src/validate/` ou `integration/validate/`
- ✅ RouterBroker usa `dataValidate`
- ✅ DTOs definidos corretamente

### Security
**Verificar**:
- ✅ Guards aplicados (auth.guard, instance.guard)
- ✅ Sem dados sensíveis em logs
- ✅ Sem tokens/API keys hard-coded
- ✅ Rate limiting apropriado

## 3. Database (se aplicável)

### Multi-provider Compatibility
**Verificar**:
- ✅ Código compatível com PostgreSQL E MySQL
- ✅ Migrations criadas para AMBOS providers
- ✅ Testes em ambos bancos (se possível)

### Migrations
Se mudanças no schema:
```bash
export DATABASE_PROVIDER=postgresql
npm run db:migrate:dev

export DATABASE_PROVIDER=mysql  
npm run db:migrate:dev
```

**Verificar**:
- ✅ Migration criada em `prisma/postgresql-migrations/`
- ✅ Migration criada em `prisma/mysql-migrations/`
- ✅ Prisma client regenerado
- ✅ Schema sincronizado

## 4. Error Handling

**Verificar**:
- ✅ Try-catch em código assíncrono
- ✅ Custom exceptions usadas corretamente (400, 401, 403, 404, 500)
- ✅ Mensagens de erro claras e úteis
- ✅ Retry logic para operações externas (com exponential backoff)
- ✅ Graceful degradation implementado

## 5. Logging

**Verificar**:
- ✅ Logs apropriados (debug, info, warn, error)
- ✅ NUNCA logar dados sensíveis
- ✅ Structured logging (JSON format via Pino)
- ✅ Context adequado nos logs

## 6. Architecture & Patterns

**Verificar**:
- ✅ Service Layer Pattern seguido
  - Controllers: camada fina HTTP
  - Services: lógica de negócio
  - Repository: acesso a dados
- ✅ RouterBroker pattern usado
- ✅ DTOs definidos em `src/api/dto/`
- ✅ Integrations seguem estrutura modular padrão
- ✅ Sem lógica de negócio em controllers

## 7. Testing

### Manual Testing
**Executar**:
1. `npm run dev:server`
2. Testar endpoints com Postman/Insomnia
3. Verificar logs: `tail -f logs/*.log`
4. Testar cenários de erro
5. Testar multi-tenancy (se aplicável)

**Verificar**:
- ✅ Endpoint responde corretamente
- ✅ Validação de input funciona
- ✅ Erros retornam status HTTP correto
- ✅ Logs aparecem corretamente
- ✅ Performance aceitável

### Integration Testing (se aplicável)
```bash
npm test
```

**Verificar**:
- ✅ Testes passam
- ✅ Coverage adequado (se testes implementados)

## 8. Documentation

### Código
**Verificar**:
- ✅ TSDoc para APIs públicas
- ✅ Comentários inline para lógica complexa
- ✅ README atualizado (se necessário)
- ✅ CLAUDE.md atualizado (se mudanças arquiteturais)

### API
**Verificar**:
- ✅ Swagger/OpenAPI atualizado (se endpoint novo/modificado)
- ✅ Tipos de request/response documentados

## 9. Git Workflow

### Commits
```bash
npm run commit       # Commit interativo (RECOMENDADO)
```

**Formato**: `feat/fix/chore(scope): description`

**Exemplos**:
- `feat(baileys): add auto-reconnect logic`
- `fix(api): resolve auth middleware issue`
- `chore(deps): update baileys to 7.0.0-rc.6`

**Verificar**:
- ✅ Conventional Commits seguido
- ✅ Mensagem descritiva e clara
- ✅ Scope apropriado
- ✅ SEM atribuição Claude (`Co-Authored-By: Claude`)

### Pull Request (se aplicável)
```bash
git push origin username/feature-name
```

**Criar PR para**: `next` (branch principal)

**Verificar**:
- ✅ Branch nomeada: `username/feature-name`
- ✅ PR para `next` branch
- ✅ Descrição clara do que foi feito
- ✅ Screenshots/exemplos (se UI)
- ✅ Breaking changes documentados (se houver)

## 10. Environment & Configuration

**Verificar**:
- ✅ Novas env vars adicionadas a `.env.example`
- ✅ Config types atualizados em `src/config/env.config.ts`
- ✅ Valores default apropriados
- ✅ Documentação de env vars (se necessário)

## 11. Dependencies

Se adicionou/atualizou dependências:

**Verificar**:
- ✅ Package.json atualizado
- ✅ pnpm-lock.yaml atualizado
- ✅ Versões compatíveis
- ✅ Licenças compatíveis
- ✅ Security vulnerabilities verificadas

```bash
pnpm audit          # Verificar vulnerabilidades
pnpm outdated       # Verificar dependências desatualizadas
```

## 12. Performance & Resources

**Verificar**:
- ✅ Sem memory leaks
- ✅ Connection pooling usado (database)
- ✅ Cache implementado onde apropriado
- ✅ Queries otimizadas (se banco de dados)
- ✅ Sem N+1 queries
- ✅ Rate limiting apropriado

## 13. Multi-tenancy (se aplicável)

**Verificar**:
- ✅ Isolamento de instâncias mantido
- ✅ Configurações independentes por instância
- ✅ Sem vazamento de dados entre instâncias
- ✅ Autenticação por instância funcional

## 14. Integration-Specific (se aplicável)

### WhatsApp Integrations
**Verificar**:
- ✅ Interface unificada entre providers
- ✅ Connection lifecycle gerenciado
- ✅ Reconexão automática implementada
- ✅ Session persistence funcional

### Chatbot Integrations
**Verificar**:
- ✅ Webhook signature validation
- ✅ Event handling correto
- ✅ Retry logic implementado

### Storage Integrations
**Verificar**:
- ✅ Fallback para local storage
- ✅ URLs de mídia geradas corretamente
- ✅ Cleanup de arquivos temporários

## Quick Checklist (Resumo)

Antes de fazer commit/PR, verificar:

- [ ] `npm run lint` - Sem erros
- [ ] `npm run build` - Build com sucesso
- [ ] Testes manuais executados e passando
- [ ] Código segue patterns do projeto
- [ ] Sem dados sensíveis expostos
- [ ] Multi-database compatibility (se DB)
- [ ] Documentação atualizada
- [ ] Conventional Commit usado
- [ ] .env.example atualizado (se novas vars)

## Quando Pular Alguns Passos

- **Docs-only changes**: Pode pular build/test
- **Config changes**: Focar em validation e testing
- **Hotfix crítico**: Lint + quick test + commit
- **Dependency update**: Audit + test + update lockfile

## Observações Importantes

- **Sempre responder em PT-BR** ao usuário
- **Sem emojis** em commits ou código
- **Security-first**: Validação e segurança são OBRIGATÓRIAS
- **Multi-database**: Lembrar compatibilidade PostgreSQL E MySQL
- **Manual testing** é a abordagem primária atualmente
