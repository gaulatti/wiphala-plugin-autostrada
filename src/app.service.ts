import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'src/decorators/logger.decorator';
import { WiphalaService } from 'src/interfaces/wiphala.interface';
import { JSONLogger } from 'src/utils/logger';
import { WorkerRequest, WorkerResponse } from './types/worker';
import { categories, runPageSpeedInsights, strategies } from './utils/psi';

@Injectable()
export class AppService {
  /**
   * Logger instance for logging messages.
   */
  @Logger(AppService.name)
  private readonly logger!: JSONLogger;

  private wiphalaService: WiphalaService;
  constructor(@Inject('wiphala') private readonly client: ClientGrpc) {}

  performTask(input: WorkerRequest): WorkerResponse {
    const request = JSON.parse(input.payload);
    /**
     * Curious hack: onModuleInit should have been enough but it's not being initialized.
     * So we're initializing the gRPC client here.
     */
    if (!this.wiphalaService) {
      this.wiphalaService =
        this.client.getService<WiphalaService>('WiphalaService');
    }

    /**
     * Route the request where applicable.
     */
    switch (request.name) {
      case 'AutostradaCollect':
        void this.collect(request);
        break;
      case 'AutostradaProcess':
        void this.process(request);
        break;
    }

    return { success: true };
  }

  async collect(request: {
    name: string;
    playlist: { slug: string };
    context: { metadata: { url: string } };
  }) {
    const { url } = request.context.metadata;
    if (!url) {
      throw new Error('URL is required in the event object.');
    }
    try {
      const executions: Promise<string>[] = [];
      for (const currentCategory of categories) {
        for (const currentStrategy of strategies) {
          executions.push(
            runPageSpeedInsights(
              request.playlist.slug,
              url,
              currentCategory,
              currentStrategy,
            ),
          );
        }
      }

      /**
       * Run all the executions in parallel.
       */
      const results = await Promise.all(executions);

      /**
       * Deliver to Wiphala
       */
      const output = await firstValueFrom(
        this.wiphalaService.segue({
          slug: request.playlist.slug,
          output: JSON.stringify(results),
          operation: request.name,
        }),
      );
      console.log({ output });
    } catch (error) {
      throw new Error(`Error triggering PageSpeed Insights Worker (${error})`);
    }
  }

  process(request: {
    name: string;
    playlist: { slug: string };
    context: { metadata: { url: string } };
  }) {
    /**
     * Deliver to Wiphala
     */
    void firstValueFrom(
      this.wiphalaService.segue({
        slug: request.playlist.slug,
        output: JSON.stringify([]),
        operation: request.name,
      }),
    );
  }
}
