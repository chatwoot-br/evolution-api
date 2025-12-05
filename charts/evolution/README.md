# Evolution API Helm Chart

Este chart do Helm instala a Evolution API no Kubernetes com suporte a migração automática de banco de dados.

## Funcionalidades

- Deployment da Evolution API
- Init container para migrações de banco de dados
- ConfigMap e Secret para configurações
- Service para exposição da aplicação
- Ingress opcional
- HPA (Horizontal Pod Autoscaler) opcional
- CronJob para restart automático opcional

## Migração de Banco de Dados

### Init Container de Migração

O chart inclui um init container que executa as migrações do banco de dados antes da aplicação principal iniciar. Esta funcionalidade substitui a necessidade de executar migrações no ENTRYPOINT do Dockerfile.

#### Configuração da Migração

```yaml
migration:
  # Habilita o init container de migração
  enabled: true

  # Configuração da imagem do init container
  # Se não especificado, usa a mesma imagem do container principal
  image:
    repository: ""  # Usa image.repository principal se vazio
    tag: ""         # Usa image.tag principal se vazio
    pullPolicy: ""  # Usa image.pullPolicy principal se vazio

  # Limites de recursos para o init container
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi

  # Volume mounts adicionais para o init container
  volumeMounts: []
```

#### Como Funciona

1. O init container é executado antes do container principal
2. Executa o script `./Docker/scripts/deploy_database.sh`
3. O script verifica o `DATABASE_PROVIDER` e executa as migrações apropriadas
4. Gera o cliente Prisma após as migrações
5. Só após a conclusão bem-sucedida, o container principal inicia

#### Variáveis de Ambiente

O init container recebe as mesmas variáveis de ambiente do container principal via ConfigMap e Secret, além de:

- `DOCKER_ENV=true`: Indica que está executando em ambiente Docker

#### Provider de Banco de Dados

O script de migração suporta os seguintes providers:
- `postgresql`
- `mysql`
- `psql_bouncer`

#### Desabilitando Migrações

Para desabilitar as migrações automáticas:

```yaml
migration:
  enabled: false
```

### Vantagens do Init Container

1. **Separação de responsabilidades**: Migrações executam em container separado
2. **Controle de recursos**: Recursos específicos para migrações
3. **Falha rápida**: Se migração falhar, pod não inicia
4. **Logs separados**: Logs de migração separados dos logs da aplicação
5. **Reutilização**: Mesma imagem, comandos diferentes

## Instalação

```bash
# Instalar o chart
helm install evolution ./charts/evolution

# Instalar com configurações customizadas
helm install evolution ./charts/evolution -f values-custom.yaml

# Upgrade do chart
helm upgrade evolution ./charts/evolution
```

## Configuração

### Configurações Principais

Todas as configurações da Evolution API são definidas no `values.yaml`:

- `config`: Configurações da aplicação (via ConfigMap)
- `secret`: Configurações sensíveis (via Secret)
- `migration`: Configurações do init container de migração

### Exemplo de Configuração Customizada

```yaml
# values-production.yaml
migration:
  enabled: true
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 200m
      memory: 256Mi

config:
  DATABASE_PROVIDER: "postgresql"
  CACHE_REDIS_ENABLED: "true"

secret:
  DATABASE_CONNECTION_URI: "postgresql://user:pass@postgres:5432/evolution"
  CACHE_REDIS_URI: "redis://redis:6379/1"
```

## Troubleshooting

### Problemas de Migração

Se o init container falhar:

1. Verificar logs do init container:
```bash
kubectl logs <pod-name> -c evolution-migration
```

2. Verificar configurações de banco:
```bash
kubectl get configmap <release-name>-config -o yaml
kubectl get secret <release-name>-secrets -o yaml
```

3. Verificar conectividade com banco:
```bash
kubectl exec -it <pod-name> -c evolution-migration -- bash
# Testar conexão manualmente
```

### Migration Container Stuck

Se o init container ficar preso:

1. Verificar se o banco de dados está acessível
2. Verificar se as credenciais estão corretas
3. Verificar se o schema/database existe
4. Verificar logs para erros específicos

## Monitoramento

### Health Checks

O container principal inclui:
- Liveness probe: `/health/liveness`
- Readiness probe: `/health/readiness`

### Logs

```bash
# Logs do container principal
kubectl logs <pod-name> -c evolution

# Logs do init container de migração
kubectl logs <pod-name> -c evolution-migration

# Seguir logs em tempo real
kubectl logs -f <pod-name> -c evolution
```

## Segurança

### Secrets

Configurações sensíveis são armazenadas em Kubernetes Secrets:
- `DATABASE_CONNECTION_URI`
- `AUTHENTICATION_API_KEY`
- `CACHE_REDIS_URI`
- `S3_ACCESS_KEY` / `S3_SECRET_KEY`

### Service Account

O chart cria um Service Account dedicado que pode ser usado para RBAC.

## Recursos Adicionais

- [Evolution API Documentation](https://doc.evolution-api.com)
- [Kubernetes Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Helm Documentation](https://helm.sh/docs/)