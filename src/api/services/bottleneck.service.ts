import { Logger } from '@config/logger.config';
import Bottleneck from 'bottleneck';

export class BottleneckService {
  private readonly logger = new Logger('BottleneckService');
  private instanceLimiters = new Map<string, Bottleneck>();

  // Creates or gets an existing bottleneck limiter for a specific instance
  private getInstanceLimiter(instanceName: string): Bottleneck {
    if (!this.instanceLimiters.has(instanceName)) {
      const limiter = new Bottleneck({
        minTime: 1000, // 1 second minimum interval between requests
        maxConcurrent: 1, // Only one request at a time per instance
        // reservoir: 1, // Start with 1 token
        // reservoirRefreshAmount: 1, // Add 1 token on refresh
        // reservoirRefreshInterval: 1000, // Refresh every 1 second
      });

      // Add error handling
      limiter.on('error', (error) => {
        this.logger.error(`Bottleneck error for instance ${instanceName}: ${error.message}`);
      });

      this.instanceLimiters.set(instanceName, limiter);
      this.logger.info(`Created bottleneck limiter for instance: ${instanceName}`);
    }

    return this.instanceLimiters.get(instanceName)!;
  }

  // Queue a webhook execution for a specific instance
  public async scheduleWebhook<T>(instanceName: string, webhookFunction: () => Promise<T>): Promise<T> {
    const limiter = this.getInstanceLimiter(instanceName);

    // Get queue status before scheduling
    const queuedCount = limiter.queued();

    this.logger.debug(`Scheduling webhook for instance: ${instanceName} - Queue: ${queuedCount} queued`);

    return limiter.schedule(async () => {
      // Get queue status when executing
      const currentQueued = limiter.queued();

      this.logger.debug(`Executing webhook for instance: ${instanceName} - Queue: ${currentQueued} queued`);
      return webhookFunction();
    });
  }

  // Clean up limiter when instance is removed
  public removeInstanceLimiter(instanceName: string): void {
    const limiter = this.instanceLimiters.get(instanceName);
    if (limiter) {
      // Stop the limiter and clear any pending jobs
      limiter.stop({ dropWaitingJobs: true });
      this.instanceLimiters.delete(instanceName);
      this.logger.info(`Removed bottleneck limiter for instance: ${instanceName}`);
    }
  }

  // Get current queue status for an instance
  public async getInstanceStatus(instanceName: string): Promise<{ queued: number; running: number }> {
    const limiter = this.instanceLimiters.get(instanceName);
    if (!limiter) {
      return { queued: 0, running: 0 };
    }

    return {
      queued: limiter.queued(),
      running: await limiter.running(),
    };
  }

  // Get all active instances
  public getActiveInstances(): string[] {
    return Array.from(this.instanceLimiters.keys());
  }

  // Clean up all limiters (useful for graceful shutdown)
  public cleanupAll(): void {
    this.logger.info('Cleaning up all bottleneck limiters');
    for (const [instanceName, limiter] of this.instanceLimiters) {
      limiter.stop({ dropWaitingJobs: true });
      this.logger.debug(`Cleaned up limiter for instance: ${instanceName}`);
    }
    this.instanceLimiters.clear();
  }
}

// Export a singleton instance
export const bottleneckService = new BottleneckService();
