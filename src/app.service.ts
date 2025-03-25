import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'src/decorators/logger.decorator';
import { WiphalaService } from 'src/interfaces/wiphala.interface';
import { JSONLogger } from 'src/utils/logger';
import { WorkerRequest, WorkerResponse } from './types/worker';

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

  collect(request: {
    name: string;
    playlist: { slug: string };
    context: { metadata: { url: string } };
  }) {
    void firstValueFrom(
      this.wiphalaService.segue({
        slug: request.playlist.slug,
        output: JSON.stringify([]),
        operation: request.name,
      }),
    );
  }

  process(request: {
    name: string;
    playlist: { slug: string };
    context: { metadata: { url: string } };
  }) {
    void firstValueFrom(
      this.wiphalaService.segue({
        slug: request.playlist.slug,
        output: JSON.stringify([]),
        operation: request.name,
      }),
    );
  }
}
