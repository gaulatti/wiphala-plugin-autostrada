import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Logger } from 'src/decorators/logger.decorator';
import { WiphalaService } from 'src/interfaces/wiphala.interface';
import { JSONLogger } from 'src/utils/logger';

@Injectable()
export class AppService {
  /**
   * Logger instance for logging messages.
   */
  @Logger(AppService.name)
  private readonly logger!: JSONLogger;

  private wiphalaService: WiphalaService;
  constructor(@Inject('wiphala') private readonly client: ClientGrpc) {}

  /**
   * Lifecycle hook that is called when the module is initialized.
   * This method retrieves and assigns the WiphalaService instance
   * from the client to the `WiphalaService` property.
   */
  onModuleInit() {
    this.wiphalaService =
      this.client.getService<WiphalaService>('WiphalaService');
  }
  
  getHello(): string {
    return 'Hello World!';
  }
}
