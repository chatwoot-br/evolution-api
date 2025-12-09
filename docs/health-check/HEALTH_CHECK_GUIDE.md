# Health Check Endpoints para Kubernetes

Este documento descreve os endpoints de health check implementados na Evolution API seguindo as melhores práticas para integração com Kubernetes.

## Endpoints Disponíveis

### 1. `/health` - Health Check Geral
**Método:** GET
**Descrição:** Endpoint de health check geral que retorna informações completas sobre o estado da aplicação.

**Resposta de Sucesso (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-08-31T10:00:00.000Z",
  "uptime": 3600,
  "version": "2.3.1",
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 15
    },
    "cache": {
      "status": "ok",
      "type": "redis",
      "responseTime": 3
    },
    "memory": {
      "status": "ok",
      "usage": {
        "rss": 104857600,
        "heapTotal": 67108864,
        "heapUsed": 45088768,
        "external": 2097152,
        "arrayBuffers": 524288
      },
      "percentage": 67.2
    }
  },
  "details": {
    "nodeVersion": "v18.19.0",
    "platform": "linux",
    "arch": "x64",
    "pid": 1
  }
}
```

### 2. `/health/liveness` - Liveness Probe
**Método:** GET
**Descrição:** Endpoint para liveness probe do Kubernetes. Verifica se a aplicação está funcionando.

**Características:**
- ✅ Retorna sucesso mesmo se dependências estão temporariamente indisponíveis
- ✅ Foca em verificar se o processo da aplicação está respondendo
- ✅ Falha apenas em casos críticos (ex: memória esgotada)
- ⚠️ Kubernetes reinicia o pod se este endpoint falhar repetidamente

**Uso no Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

### 3. `/health/readiness` - Readiness Probe
**Método:** GET
**Descrição:** Endpoint para readiness probe do Kubernetes. Verifica se a aplicação está pronta para receber tráfego.

**Características:**
- ✅ Verifica todas as dependências críticas (banco, cache, etc.)
- ✅ Falha se alguma dependência não estiver disponível
- ⚠️ Kubernetes remove o pod do balanceamento se este endpoint falhar

**Resposta de Sucesso (200):**
```json
{
  "status": "ready",
  "timestamp": "2025-08-31T10:00:00.000Z",
  "checks": {
    "database": true,
    "cache": true,
    "dependencies": true
  },
  "message": "Service is ready to accept traffic"
}
```

**Resposta de Falha (503):**
```json
{
  "status": "not_ready",
  "timestamp": "2025-08-31T10:00:00.000Z",
  "checks": {
    "database": false,
    "cache": true,
    "dependencies": true
  },
  "message": "Service is not ready - some dependencies are unavailable"
}
```

**Uso no Kubernetes:**
```yaml
readinessProbe:
  httpGet:
    path: /health/readiness
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

### 4. `/health/startup` - Startup Probe
**Método:** GET
**Descrição:** Endpoint para startup probe do Kubernetes. Verifica se a aplicação terminou de inicializar.

**Características:**
- ✅ Usado para aplicações que demoram para inicializar
- ✅ Desabilita liveness e readiness durante o startup
- ✅ Mais tolerante que readiness probe
- ⚠️ Considera "started" se pelo menos o banco estiver funcionando

**Uso no Kubernetes:**
```yaml
startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 30  # 150s total para startup
```

## Verificações Realizadas

### Database Check
- **Liveness:** Verifica conectividade básica com timeout curto
- **Readiness:** Verifica conectividade + operações básicas
- **Método:** Executa query simples na tabela `instance`

### Cache Check
- **Suporte:** Redis e Local Cache
- **Operações:** SET, GET, DELETE para verificar funcionamento
- **Fallback:** Se cache desabilitado, considera OK

### Memory Check
- **Thresholds:** 
  - ✅ OK: < 75% de uso
  - ⚠️ Warning: 75-90% de uso
  - ❌ Error: > 90% de uso
- **Impact:** Liveness falha apenas se memória crítica

### Dependencies Check
- Verifica configurações essenciais
- Validações de ambiente e configuração
- Verifica disponibilidade de porta do servidor

## Configuração Recomendada para Kubernetes

### Produção
```yaml
# Startup Probe - para aplicações que demoram para inicializar
startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 30

# Liveness Probe - reinicia se não responder
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 30
  failureThreshold: 3

# Readiness Probe - remove do balanceamento se não estiver pronto
readinessProbe:
  httpGet:
    path: /health/readiness
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

### Desenvolvimento
```yaml
# Configurações mais tolerantes para desenvolvimento
startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 3
  failureThreshold: 20

livenessProbe:
  httpGet:
    path: /health/liveness
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 15
  failureThreshold: 5

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 8080
  initialDelaySeconds: 3
  periodSeconds: 5
  failureThreshold: 5
```

## Monitoramento e Alertas

### Métricas Importantes
- Response time dos health checks
- Taxa de falha dos probes
- Uso de memória reportado
- Status das dependências

### Alertas Recomendados
```yaml
# Exemplo de alert para Prometheus
- alert: EvolutionAPIDown
  expr: up{job="evolution-api"} == 0
  for: 1m
  annotations:
    summary: "Evolution API is down"

- alert: EvolutionAPIHighMemory
  expr: evolution_api_memory_usage_percent > 85
  for: 5m
  annotations:
    summary: "Evolution API high memory usage"

- alert: EvolutionAPIDatabaseDown
  expr: evolution_api_database_status != 1
  for: 2m
  annotations:
    summary: "Evolution API database connectivity issues"
```

## Troubleshooting

### Liveness Probe Falhando
1. Verificar logs da aplicação
2. Verificar uso de memória
3. Verificar se processo está travado
4. Considerar aumentar timeout/threshold

### Readiness Probe Falhando
1. Verificar conectividade com banco de dados
2. Verificar conectividade com Redis (se habilitado)
3. Verificar logs de dependências
4. Verificar configurações de ambiente

### Startup Probe Falhando
1. Verificar tempo de inicialização da aplicação
2. Aumentar `failureThreshold` se necessário
3. Verificar dependências críticas no startup
4. Verificar recursos disponíveis (CPU/memória)

## Segurança

### Considerações
- ✅ Endpoints de health não requerem autenticação
- ✅ Não expõem informações sensíveis
- ✅ Rate limiting pode ser aplicado se necessário
- ⚠️ Considerar restringir acesso via network policies

### Network Policy Exemplo
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: evolution-api-health-check
spec:
  podSelector:
    matchLabels:
      app: evolution-api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: kube-system  # Permitir kubelet
    ports:
    - protocol: TCP
      port: 8080
```

## Logs

Os health checks geram logs estruturados:

```
[HealthController] Liveness check completed in 15ms
[HealthController] Readiness check completed in 23ms - Status: ready
[HealthController] Database liveness check failed (non-critical): Connection timeout
[HealthController] Cache readiness check failed: Redis connection refused
```

Níveis de log:
- `verbose`: Verificações bem-sucedidas
- `warn`: Falhas não críticas (liveness)
- `error`: Falhas críticas (readiness)
