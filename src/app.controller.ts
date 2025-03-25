import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AppService } from './app.service';
import { WorkerRequest, WorkerResponse } from './types/worker';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod('WorkerService', 'PerformTask')
  performTask(request: WorkerRequest): WorkerResponse {
    return this.appService.performTask(request);
  }
}
