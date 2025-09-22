import { RouterBroker } from '@api/abstract/abstract.router';
import { HealthController } from '@api/controllers/health.controller';
import { PrismaRepository } from '@api/repository/repository.service';
import { HttpStatus } from '@api/routes/index.router';
import { configService } from '@config/env.config';
import { RequestHandler, Router } from 'express';

export class HealthRouter extends RouterBroker {
  private readonly healthController: HealthController;

  constructor() {
    super();

    // Inicializa o controller de health check
    const prismaRepository = new PrismaRepository(configService);
    this.healthController = new HealthController(configService, prismaRepository);

    this.setupRoutes();
  }

  private setupRoutes() {
    this.router
      /**
       * @swagger
       * /health:
       *   get:
       *     summary: Health check endpoint
       *     description: Returns the overall health status of the application including database, cache, and memory usage
       *     tags: [Health]
       *     responses:
       *       200:
       *         description: Service is healthy
       *         content:
       *           application/json:
       *             schema:
       *               type: object
       *               properties:
       *                 status:
       *                   type: string
       *                   enum: [ok, error]
       *                 timestamp:
       *                   type: string
       *                   format: date-time
       *                 uptime:
       *                   type: number
       *                 version:
       *                   type: string
       *                 environment:
       *                   type: string
       *                 checks:
       *                   type: object
       *       500:
       *         description: Service is unhealthy
       */
      .get('/health', async (req, res) => {
        try {
          const healthResult = await this.healthController.health();
          const statusCode = healthResult.status === 'ok' ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;

          res.status(statusCode).json(healthResult);
        } catch (error) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })

      /**
       * @swagger
       * /health/liveness:
       *   get:
       *     summary: Kubernetes liveness probe
       *     description: |
       *       Liveness probe endpoint for Kubernetes. This endpoint checks if the application process is running.
       *       It should return success even if some dependencies are temporarily unavailable.
       *       Kubernetes will restart the pod if this endpoint fails repeatedly.
       *     tags: [Health, Kubernetes]
       *     responses:
       *       200:
       *         description: Application is alive
       *         content:
       *           application/json:
       *             schema:
       *               type: object
       *               properties:
       *                 status:
       *                   type: string
       *                   enum: [ok, error]
       *                 timestamp:
       *                   type: string
       *                   format: date-time
       *                 uptime:
       *                   type: number
       *                 checks:
       *                   type: object
       *       500:
       *         description: Application is not alive (pod should be restarted)
       */
      .get('/health/liveness', async (req, res) => {
        try {
          const livenessResult = await this.healthController.liveness();
          const statusCode = livenessResult.status === 'ok' ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;

          res.status(statusCode).json(livenessResult);
        } catch (error) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Liveness check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })

      /**
       * @swagger
       * /health/readiness:
       *   get:
       *     summary: Kubernetes readiness probe
       *     description: |
       *       Readiness probe endpoint for Kubernetes. This endpoint checks if the application is ready to receive traffic.
       *       It verifies that all critical dependencies (database, cache, etc.) are available and working.
       *       Kubernetes will remove the pod from service if this endpoint fails.
       *     tags: [Health, Kubernetes]
       *     responses:
       *       200:
       *         description: Application is ready to receive traffic
       *         content:
       *           application/json:
       *             schema:
       *               type: object
       *               properties:
       *                 status:
       *                   type: string
       *                   enum: [ready, not_ready]
       *                 timestamp:
       *                   type: string
       *                   format: date-time
       *                 checks:
       *                   type: object
       *                   properties:
       *                     database:
       *                       type: boolean
       *                     cache:
       *                       type: boolean
       *                     dependencies:
       *                       type: boolean
       *                 message:
       *                   type: string
       *       503:
       *         description: Application is not ready (should not receive traffic)
       */
      .get('/health/readiness', async (req, res) => {
        try {
          const readinessResult = await this.healthController.readiness();
          const statusCode = readinessResult.status === 'ready' ? HttpStatus.OK : 503; // Service Unavailable

          res.status(statusCode).json(readinessResult);
        } catch (error) {
          res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            error: 'Readiness check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })

      /**
       * @swagger
       * /health/startup:
       *   get:
       *     summary: Kubernetes startup probe
       *     description: |
       *       Startup probe endpoint for Kubernetes. This endpoint is used to know when a container application has started.
       *       During the startup phase, both liveness and readiness probes are disabled until this probe succeeds.
       *       This is useful for slow-starting containers to avoid them getting killed by Kubernetes before they are up and running.
       *     tags: [Health, Kubernetes]
       *     responses:
       *       200:
       *         description: Application has started successfully
       *       503:
       *         description: Application is still starting up
       */
      .get('/health/startup', async (req, res) => {
        try {
          // Para o startup probe, fazemos uma verificação similar ao readiness
          // mas com tolerância maior para aplicações que demoram para inicializar
          const readinessResult = await this.healthController.readiness();

          // Considera started se pelo menos o banco estiver funcionando
          // Isso permite que a aplicação seja considerada "started" mesmo que
          // algumas dependências não críticas ainda estejam se inicializando
          const isStarted = readinessResult.checks.database;

          const statusCode = isStarted ? HttpStatus.OK : 503;

          res.status(statusCode).json({
            status: isStarted ? 'started' : 'starting',
            timestamp: new Date().toISOString(),
            checks: readinessResult.checks,
            message: isStarted ? 'Application has started successfully' : 'Application is still starting up',
          });
        } catch (error) {
          res.status(503).json({
            status: 'starting',
            timestamp: new Date().toISOString(),
            error: 'Startup check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
  }

  public readonly router: Router = Router();
}
