import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { nanoid } from 'nanoid';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'src/decorators/logger.decorator';
import { WiphalaService } from 'src/interfaces/wiphala.interface';
import { JSONLogger } from 'src/utils/logger';
import { WorkerRequest, WorkerResponse } from './types/worker';
import { groupFilesById } from './utils/files';
import {
  categories,
  mergeOutputFiles,
  runPageSpeedInsights,
  strategies,
} from './utils/psi';

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
   * Handles a worker request by routing it to the appropriate service method
   * and ensuring the gRPC client is initialized if necessary.
   *
   * @param input - The worker request containing the payload to process.
   * @returns A `WorkerResponse` indicating the success of the operation.
   *
   * @remarks
   * - The method initializes the `wiphalaService` gRPC client if it has not been
   *   initialized yet. This is a workaround for an issue where `onModuleInit`
   *   does not properly initialize the client.
   * - Routes the request based on the `name` property in the payload:
   *   - `'AutostradaCollect'`: Calls the `collect` method.
   *   - `'AutostradaProcess'`: Calls the `process` method.
   */
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

  /**
   * Collects and processes PageSpeed Insights data for a given playlist and URL.
   *
   * @param request - The request object containing the following properties:
   *   - `name`: The name of the operation being performed.
   *   - `playlist`: An object containing the `slug` of the playlist.
   *   - `context`: An object containing metadata, including the `url` to analyze.
   *
   * @throws {Error} If the `url` is not provided in the request's metadata.
   * @throws {Error} If an error occurs while triggering the PageSpeed Insights Worker.
   *
   * The function performs the following steps:
   * 1. Validates the presence of the `url` in the request's metadata.
   * 2. Iterates through predefined categories and strategies to create a list of
   *    PageSpeed Insights execution promises.
   * 3. Executes all promises in parallel using `Promise.all`.
   * 4. Sends the results to the Wiphala service for further processing.
   */
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
      for (const currentStrategy of strategies) {
        const slug = nanoid();
        for (const currentCategory of categories) {
          executions.push(
            runPageSpeedInsights(url, slug, currentCategory, currentStrategy),
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
      void firstValueFrom(
        this.wiphalaService.segue({
          slug: request.playlist.slug,
          output: JSON.stringify(results),
          operation: request.name,
        }),
      );
    } catch (error) {
      throw new Error(`Error triggering PageSpeed Insights Worker (${error})`);
    }
  }

  /**
   * Processes a request by isolating files, merging outputs, and delivering the result.
   *
   * @param request - The input request object containing the following properties:
   *   - `name` (string): The name of the operation being processed.
   *   - `playlist` (object): Contains the `slug` (string) identifying the playlist.
   *   - `context` (object): Includes metadata and a sequence of operations:
   *     - `metadata` (object): Contains a `url` (string).
   *     - `sequence` (array): A list of objects representing previous operations, each with:
   *       - `name` (string): The name of the operation.
   *       - `output` (any[]): The output data from the operation.
   *
   * The function performs the following steps:
   * 1. Retrieves data from the previous `AutostradaCollect` operation in the sequence.
   * 2. Isolates mobile and desktop files from the collected output.
   * 3. Merges the isolated files into simplified results for mobile and desktop.
   * 4. Sends the merged results to the Wiphala service for further processing.
   *
   * @returns A promise that resolves when the processing and delivery are complete.
   */
  async process(request: {
    name: string;
    playlist: { slug: string };
    context: {
      metadata: { url: string };
      sequence: { name: string; output: any }[];
    };
  }) {
    /**
     * Get the data from previous AutostradaCollect
     */
    const collectedData = request.context.sequence.find(
      (item) => item.name === 'AutostradaCollect',
    );

    /**
     * Groups files by their unique identifier extracted from the filename.
     */
    const groupedFiles = (collectedData?.output || []).reduce(
      groupFilesById,
      {},
    );

    /**
     * Merge files accordingly
     */
    const mergedFiles = await Promise.all(
      Object.entries(groupedFiles).map(
        async ([slug, files]: [_id: string, files: string[]]) => {
          return mergeOutputFiles(slug, files);
        },
      ),
    );

    /**
     * Deliver to Wiphala
     */
    void firstValueFrom(
      this.wiphalaService.segue({
        slug: request.playlist.slug,
        output: JSON.stringify(mergedFiles),
        operation: request.name,
      }),
    );
  }
}
