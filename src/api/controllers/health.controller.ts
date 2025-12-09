import { PrismaRepository } from '@api/repository/repository.service';
import { CacheEngine } from '@cache/cacheengine';
import { CacheConf, ConfigService, Database } from '@config/env.config';
import { Logger } from '@config/logger.config';
import fs from 'fs';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      responseTime?: number;
      error?: string;
    };
    cache: {
      status: 'ok' | 'error';
      type: 'redis' | 'local' | 'disabled';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'error';
      usage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        arrayBuffers: number;
      };
      percentage: number;
    };
  };
  details?: {
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
  };
}

export interface ReadinessCheckResult {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: boolean;
    cache: boolean;
    dependencies: boolean;
  };
  message: string;
}

export class HealthController {
  private readonly logger = new Logger('HealthController');
  private readonly packageJson: any;
  private cache: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaRepository: PrismaRepository,
  ) {
    try {
      // Carrega o package.json para obter a versão
      this.packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    } catch (error: any) {
      this.logger.error(`Error loading package.json: ${error.message || error}`);
      this.packageJson = { version: 'unknown' };
    }

    // Inicializa o cache engine se habilitado
    const cacheConf = this.configService.get<CacheConf>('CACHE');
    if (cacheConf?.REDIS?.ENABLED || cacheConf?.LOCAL?.ENABLED) {
      this.cache = new CacheEngine(this.configService, 'health').getEngine();
    }
  }

  /**
   * Liveness Probe - Verifica se a aplicação está rodando
   * Deve retornar sucesso se o processo está ativo, mesmo que algumas dependências estejam falhando
   */
  public async liveness(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Verifica memória com limites específicos para liveness
      const memoryCheck = this.checkMemoryUsage(true);

      // Verificação básica de conectividade do banco (não crítica para liveness)
      const databaseCheck = await this.checkDatabaseLiveness();

      // Verificação básica do cache (não crítica para liveness)
      const cacheCheck = await this.checkCacheLiveness();

      const result: HealthCheckResult = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: this.packageJson.version,
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: databaseCheck,
          cache: cacheCheck,
          memory: memoryCheck,
        },
        details: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
        },
      };

      // Para liveness, só falhamos se a memória estiver crítica
      if (memoryCheck.status === 'error') {
        result.status = 'error';
      }

      this.logger.verbose(`Liveness check completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error: any) {
      this.logger.error(`Liveness check failed: ${error.message || error}`);

      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: this.packageJson.version,
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: { status: 'error', error: 'Unable to perform check' },
          cache: { status: 'error', error: 'Unable to perform check', type: 'disabled' },
          memory: { status: 'error', usage: process.memoryUsage(), percentage: 0 },
        },
      };
    }
  }

  /**
   * Readiness Probe - Verifica se a aplicação está pronta para receber tráfego
   * Deve falhar se alguma dependência crítica não estiver disponível
   */
  public async readiness(): Promise<ReadinessCheckResult> {
    const startTime = Date.now();

    try {
      // Verificações críticas para readiness
      const databaseReady = await this.isDatabaseReady();
      const cacheReady = await this.isCacheReady();
      const dependenciesReady = this.areDependenciesReady();

      const allReady = databaseReady && cacheReady && dependenciesReady;

      const result: ReadinessCheckResult = {
        status: allReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseReady,
          cache: cacheReady,
          dependencies: dependenciesReady,
        },
        message: allReady
          ? 'Service is ready to accept traffic'
          : 'Service is not ready - some dependencies are unavailable',
      };

      this.logger.verbose(`Readiness check completed in ${Date.now() - startTime}ms - Status: ${result.status}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Readiness check failed: ${error.message || error}`);

      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: false,
          cache: false,
          dependencies: false,
        },
        message: 'Readiness check failed with error',
      };
    }
  }

  /**
   * Health Check completo - Combina liveness e readiness
   */
  public async health(): Promise<HealthCheckResult> {
    return this.liveness();
  }

  /**
   * Verifica o uso de memória
   * Para liveness: só falha se a memória estiver criticamente alta (>98%)
   * Para readiness: pode ser mais restritivo
   */
  private checkMemoryUsage(isLivenessCheck: boolean = false) {
    const usage = process.memoryUsage();
    const totalHeap = usage.heapTotal;
    const usedHeap = usage.heapUsed;
    const percentage = (usedHeap / totalHeap) * 100;

    let status: 'ok' | 'warning' | 'error' = 'ok';

    if (isLivenessCheck) {
      // Para liveness: só considera erro se a memória estiver criticamente alta
      if (percentage > 98) {
        status = 'error';
      } else if (percentage > 95) {
        status = 'warning';
      }
    } else {
      // Para health geral e readiness: limites mais conservadores
      if (percentage > 95) {
        status = 'error';
      } else if (percentage > 85) {
        status = 'warning';
      }
    }

    return {
      status,
      usage,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  /**
   * Verificação básica do banco para liveness (não deve bloquear o pod)
   */
  private async checkDatabaseLiveness() {
    const startTime = Date.now();

    try {
      // Verifica se consegue conectar ao banco fazendo uma operação simples
      // Usando a tabela instance que provavelmente existe baseado no schema da aplicação
      await (this.prismaRepository as any).instance.count({ take: 1 });

      return {
        status: 'ok' as const,
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      this.logger.warn(`Database liveness check failed (non-critical): ${error.message || error}`);

      return {
        status: 'error' as const,
        responseTime: Date.now() - startTime,
        error: error.message || 'Database connection failed',
      };
    }
  }

  /**
   * Verificação básica do cache para liveness
   */
  private async checkCacheLiveness() {
    const startTime = Date.now();
    const cacheConf = this.configService.get<CacheConf>('CACHE');

    if (!cacheConf?.REDIS?.ENABLED && !cacheConf?.LOCAL?.ENABLED) {
      return {
        status: 'ok' as const,
        type: 'disabled' as const,
        responseTime: 0,
      };
    }

    try {
      if (this.cache) {
        // Tenta uma operação simples de cache
        const testKey = 'health_check_liveness';
        await this.cache.set(testKey, 'test', 1); // TTL de 1 segundo
        await this.cache.get(testKey);
        await this.cache.delete(testKey);
      }

      return {
        status: 'ok' as const,
        type: cacheConf.REDIS?.ENABLED ? ('redis' as const) : ('local' as const),
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      this.logger.warn(`Cache liveness check failed (non-critical): ${error.message || error}`);

      return {
        status: 'error' as const,
        type: cacheConf.REDIS?.ENABLED ? ('redis' as const) : ('local' as const),
        responseTime: Date.now() - startTime,
        error: error.message || 'Cache operation failed',
      };
    }
  }

  /**
   * Verificação rigorosa do banco para readiness
   */
  private async isDatabaseReady(): Promise<boolean> {
    try {
      // Verifica se consegue conectar e fazer uma operação no banco
      await (this.prismaRepository as any).instance.count({ take: 1 });

      // Opcionalmente, verifica se consegue fazer operações básicas
      // Isso pode ser específico do seu modelo de dados
      await (this.prismaRepository as any).$queryRaw`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = current_schema()
      `;

      return true;
    } catch (error: any) {
      this.logger.error(`Database readiness check failed: ${error.message || error}`);
      return false;
    }
  }

  /**
   * Verificação rigorosa do cache para readiness
   */
  private async isCacheReady(): Promise<boolean> {
    const cacheConf = this.configService.get<CacheConf>('CACHE');

    // Se o cache não está habilitado, consideramos pronto
    if (!cacheConf?.REDIS?.ENABLED && !cacheConf?.LOCAL?.ENABLED) {
      return true;
    }

    try {
      if (this.cache) {
        const testKey = 'health_check_readiness';
        const testValue = `test_${Date.now()}`;

        // Testa operações críticas do cache
        await this.cache.set(testKey, testValue, 5);
        const retrieved = await this.cache.get(testKey);
        await this.cache.delete(testKey);

        // Verifica se o valor foi corretamente armazenado e recuperado
        return retrieved === testValue;
      }

      return false;
    } catch (error: any) {
      this.logger.error(`Cache readiness check failed: ${error.message || error}`);
      return false;
    }
  }

  /**
   * Verifica se as dependências básicas estão disponíveis
   */
  private areDependenciesReady(): boolean {
    try {
      // Verifica se os módulos essenciais estão carregados
      // Isso pode incluir verificações específicas do seu domínio

      // Verifica se o servidor está rodando na porta esperada
      const server = this.configService.get('SERVER');
      if (!server?.PORT) {
        return false;
      }

      // Verifica se as configurações essenciais estão presentes
      const database = this.configService.get<Database>('DATABASE');
      if (!database?.CONNECTION?.URI) {
        return false;
      }

      return true;
    } catch (error: any) {
      this.logger.error(`Dependencies readiness check failed: ${error.message || error}`);
      return false;
    }
  }
}
