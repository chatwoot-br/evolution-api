# Evolution API - Comandos Sugeridos

## Build & Run

### Desenvolvimento
```bash
npm run dev:server    # Roda em desenvolvimento com hot reload (tsx watch)
npm start            # Roda com tsx (execução direta)
npm test             # Roda testes em watch mode
```

### Produção
```bash
npm run build        # TypeScript check + tsup build
npm run start:prod   # Roda build de produção
```

## Code Quality

### Linting & Formatação
```bash
npm run lint         # ESLint com auto-fix
npm run lint:check   # ESLint check apenas (sem fix)
```

### Commits
```bash
npm run commit       # Commit interativo com commitizen (RECOMENDADO)
git commit -m "..."  # Commit direto (deve seguir Conventional Commits)
npm run commitlint   # Validar mensagem de commit
```

**Formato de commit**: `feat/fix/chore(scope): description`
- Exemplos: 
  - `feat(baileys): add auto-reconnect`
  - `fix(api): resolve auth middleware`
  - `chore(deps): update dependencies`

## Database Management

### Configuração Inicial
```bash
# Definir provider (OBRIGATÓRIO antes de comandos Prisma)
export DATABASE_PROVIDER=postgresql  # ou mysql
```

### Comandos Prisma (Unix/Mac)
```bash
npm run db:generate     # Gera Prisma client (usa DATABASE_PROVIDER env)
npm run db:deploy       # Deploy migrations em produção
npm run db:migrate:dev  # Cria nova migration em desenvolvimento
npm run db:studio       # Abre Prisma Studio (GUI do banco)
```

### Comandos Prisma (Windows)
```bash
npm run db:deploy:win      # Deploy migrations (Windows)
npm run db:migrate:dev:win # Cria migration (Windows)
```

### Observações Database
- DATABASE_PROVIDER determina qual schema usar (postgresql-schema.prisma ou mysql-schema.prisma)
- Migrations são separadas por provider (postgresql-migrations/ e mysql-migrations/)
- Scripts npm automaticamente copiam migrations corretas para prisma/migrations/

## Git Workflow

### Branches
```bash
# Criar feature branch
git checkout -b username/feature-name

# Branch principal para PRs
git checkout next

# Branch atual de release
git checkout release/v2.3.5
```

### Status & Logs
```bash
git status           # Status do repositório
git log --oneline    # Log de commits
git diff            # Ver mudanças não staged
git diff --staged   # Ver mudanças staged
```

## Package Management

```bash
pnpm install         # Instalar dependências (usa pnpm 10.15.0+)
pnpm add <package>   # Adicionar dependência
pnpm remove <pkg>    # Remover dependência
pnpm update          # Atualizar dependências
```

## Docker

### Desenvolvimento
```bash
docker-compose up           # Sobe serviços (detached mode)
docker-compose -f docker-compose.dev.yaml up  # Dev environment
docker-compose down         # Para serviços
docker-compose logs -f      # Ver logs
```

### Build
```bash
docker build -t evolution-api .                    # Build imagem
docker build -f Dockerfile.metrics -t metrics .    # Build imagem de métricas
```

## Utilities (Darwin/macOS)

### Navegação & Busca
```bash
ls -la               # Lista arquivos (incluindo ocultos)
cd <directory>       # Muda diretório
pwd                  # Mostra diretório atual
find . -name "*.ts"  # Busca arquivos TypeScript
grep -r "pattern" .  # Busca padrão em arquivos
```

### Arquivos
```bash
cat <file>           # Mostra conteúdo do arquivo
head -n 20 <file>    # Mostra primeiras 20 linhas
tail -n 20 <file>    # Mostra últimas 20 linhas
tail -f logs/*.log   # Follow logs em tempo real
```

### Processos
```bash
ps aux | grep node   # Lista processos Node.js
kill <PID>           # Mata processo por PID
killall node         # Mata todos processos Node.js
lsof -i :8080        # Mostra o que usa porta 8080
```

## Monitoring & Debugging

### Logs
```bash
tail -f logs/*.log              # Acompanhar logs em tempo real
cat logs/evolution-api.log      # Ver log completo
```

### Ambiente
```bash
# Verificar variáveis de ambiente
echo $DATABASE_PROVIDER
echo $NODE_ENV

# Editar .env
cp .env.example .env
nano .env  # ou vim .env
```

## Testing (Manual)

Atualmente o projeto usa teste manual como abordagem primária:
1. Rode `npm run dev:server`
2. Use ferramentas como Postman/Insomnia para testar endpoints
3. Verifique logs em tempo real com `tail -f logs/*.log`
4. Para testes automatizados futuros: `npm test`

## Common Workflows

### Iniciar desenvolvimento
```bash
# 1. Configurar banco
export DATABASE_PROVIDER=postgresql
npm run db:generate

# 2. Iniciar servidor
npm run dev:server

# 3. (Novo terminal) Ver logs
tail -f logs/*.log
```

### Completar uma tarefa
```bash
# 1. Lint & format
npm run lint

# 2. Build (verifica TypeScript)
npm run build

# 3. Commit
npm run commit

# 4. Push
git push origin username/feature-name
```

### Deploy de migrations
```bash
# 1. Definir provider
export DATABASE_PROVIDER=postgresql

# 2. Deploy
npm run db:deploy

# 3. Verificar com Studio
npm run db:studio
```
