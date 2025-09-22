# 🩺 Health Check Implementation - Evolution API

Este documento detalha a implementação dos endpoints de health check na Evolution API, seguindo as melhores práticas para integração com Kubernetes e monitoramento de aplicações.

## 📁 Arquivos Implementados

### 1. Controller
- **`src/api/controllers/health.controller.ts`**
  - Controller principal com lógica de health checks
  - Implementa verificações de database, cache, memória e dependências
  - Diferencia entre liveness e readiness checks

### 2. Router
- **`src/api/routes/health.router.ts`**
  - Define os endpoints REST para health checks
  - Inclui documentação Swagger/OpenAPI
  - Não requer autenticação (acessível para Kubernetes)

### 3. Documentação
- **`HEALTH_CHECK_GUIDE.md`** - Guia completo de uso
- **`k8s-health-check-example.yaml`** - Exemplo de configuração Kubernetes
- **`test-health-endpoints.sh`** - Script para teste dos endpoints

## 🛠 Implementação Técnica

### Características da Implementação

#### ✅ **Melhores Práticas Seguidas**
- **Separação de responsabilidades**: Liveness vs Readiness vs Startup
- **Timeouts apropriados**: Verificações rápidas para evitar timeout
- **Graceful degradation**: Falhas parciais não quebram liveness
- **Logging estruturado**: Logs detalhados para debugging
- **Métricas de performance**: Response time das verificações
- **Configuração flexível**: Suporte a diferentes ambientes

#### 🔒 **Aspectos de Segurança**
- Endpoints sem autenticação (necessário para K8s)
- Não exposição de dados sensíveis
- Informações limitadas sobre infraestrutura interna
- Rate limiting pode ser aplicado se necessário

#### 📊 **Verificações Implementadas**

1. **Database Health**
   - Liveness: Verificação básica de conectividade
   - Readiness: Verificação completa incluindo queries

2. **Cache Health**
   - Suporte para Redis e Local Cache
   - Operações completas: SET, GET, DELETE
   - Fallback graceful se cache desabilitado

3. **Memory Health**
   - Monitoramento de uso de heap
   - Thresholds configuráveis (75%, 90%)
   - Prevenção de OOM kills

4. **Dependencies Health**
   - Verificação de configurações essenciais
   - Validação de ambiente
   - Checagem de recursos críticos

## 🚀 Como Usar

### 1. Testes Locais

```bash
# Tornar o script executável
chmod +x test-health-endpoints.sh

# Executar testes (com servidor rodando)
./test-health-endpoints.sh
```

### 2. Teste Manual dos Endpoints

```bash
# Health check geral
curl http://localhost:8080/health

# Liveness probe
curl http://localhost:8080/health/liveness

# Readiness probe
curl http://localhost:8080/health/readiness

# Startup probe
curl http://localhost:8080/health/startup
```

### 3. Configuração no Kubernetes

```yaml
# Exemplo básico no deployment
spec:
  containers:
  - name: evolution-api
    startupProbe:
      httpGet:
        path: /health/startup
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
      failureThreshold: 30
    
    livenessProbe:
      httpGet:
        path: /health/liveness
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 30
      failureThreshold: 3
    
    readinessProbe:
      httpGet:
        path: /health/readiness
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 10
      failureThreshold: 3
```

## 📈 Monitoramento e Observabilidade

### Logs de Health Check

```bash
# Visualizar logs de health check
kubectl logs -f deployment/evolution-api | grep HealthController

# Exemplos de logs
[HealthController] Liveness check completed in 15ms
[HealthController] Readiness check completed in 23ms - Status: ready
[HealthController] Database readiness check failed: Connection timeout
```

### Métricas Importantes

- **Response Time**: Tempo de resposta dos health checks
- **Failure Rate**: Taxa de falha dos probes
- **Memory Usage**: Uso de memória reportado
- **Database Connectivity**: Status da conectividade com banco
- **Cache Performance**: Performance das operações de cache

## 🔧 Configuração Avançada

### Variáveis de Ambiente

```env
# Configurações que afetam health checks
DATABASE_CONNECTION_URI=postgresql://...
REDIS_URI=redis://...
NODE_ENV=production

# Cache (afeta cache health check)
CACHE_REDIS_ENABLED=true
CACHE_LOCAL_ENABLED=false
```

### Customização de Thresholds

Para ajustar os thresholds de memória, edite o `HealthController`:

```typescript
// Customizar limites de memória
if (percentage > 95) {        // Era 90
  status = 'error';
} else if (percentage > 85) { // Era 75
  status = 'warning';
}
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. **Liveness Probe Falhando**
```bash
# Verificar logs
kubectl logs pod/evolution-api-xxx | grep "HealthController"

# Verificar recursos
kubectl top pod evolution-api-xxx

# Causas comuns:
# - Alto uso de memória (> 90%)
# - Processo travado/não responsivo
# - Timeout muito baixo
```

#### 2. **Readiness Probe Falhando**
```bash
# Verificar conectividade com banco
kubectl exec -it evolution-api-xxx -- nc -zv database-host 5432

# Verificar conectividade com Redis
kubectl exec -it evolution-api-xxx -- nc -zv redis-host 6379

# Causas comuns:
# - Banco de dados indisponível
# - Cache inacessível
# - Configurações incorretas
```

#### 3. **Startup Probe Falhando**
```bash
# Verificar tempo de inicialização
kubectl describe pod evolution-api-xxx

# Ajustar configurações se necessário:
# - Aumentar failureThreshold
# - Aumentar initialDelaySeconds
# - Verificar recursos disponíveis
```

### Debugging

```bash
# Teste manual individual dos componentes
curl -v http://localhost:8080/health/liveness
curl -v http://localhost:8080/health/readiness

# Verificar resposta detalhada
curl -s http://localhost:8080/health | jq .

# Monitorar em tempo real
watch -n 5 'curl -s http://localhost:8080/health | jq .status'
```

## 📋 Checklist de Implementação

### ✅ Para Desenvolvedores
- [ ] Health checks implementados e testados
- [ ] Logs estruturados configurados
- [ ] Testes unitários escritos
- [ ] Documentação atualizada
- [ ] Configurações de ambiente verificadas

### ✅ Para DevOps/SRE
- [ ] Probes configurados no Kubernetes
- [ ] Alertas configurados no monitoramento
- [ ] Dashboards criados para métricas
- [ ] Runbooks de troubleshooting criados
- [ ] Testes de carga realizados

### ✅ Para Produção
- [ ] Thresholds ajustados para ambiente
- [ ] Network policies configuradas
- [ ] Recursos adequados alocados
- [ ] Monitoring e alerting funcionando
- [ ] Procedimentos de resposta a incidentes definidos

## 🔄 Próximos Passos

1. **Métricas Prometheus**: Expor métricas dos health checks
2. **Circuit Breaker**: Implementar para dependências críticas
3. **Health Check Customizado**: Permitir verificações específicas por aplicação
4. **Integração com APM**: Conectar com ferramentas de monitoramento
5. **Testes de Caos**: Validar comportamento em falhas

## 📚 Referências

- [Kubernetes Health Checks](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Health Check API Pattern](https://microservices.io/patterns/observability/health-check-api.html)
- [12-Factor App - Health Checks](https://12factor.net/)
- [Node.js Health Checks Best Practices](https://nodejs.org/en/docs/guides/simple-profiling)
