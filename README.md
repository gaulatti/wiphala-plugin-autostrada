# Autostrada Plugin for Wiphala 🚀

## Introduction  
The **Autostrada Plugin** is a NestJS-based microservice written in TypeScript that implements advanced functionality for PageSpeed Insights data collection and processing. The plugin is designed to perform specific tasks—collecting and merging Lighthouse reports—while exclusively communicating with the [Wiphala](citeturn0file1) service over gRPC ports. All interactions with Wiphala are achieved through gRPC endpoints defined in the protocol buffers (see the files in the [proto](citeturn0file3) directory). This plugin builds on the fast and efficient Fastify adapter for the REST API layer and utilizes AWS S3 for storage operations.

## Features  
- **gRPC Communication:**  
  The plugin sends all data exclusively to the Wiphala service through gRPC. When a task is executed, the plugin initializes the gRPC client and calls either the `collect` or `process` method as defined by the incoming payload (citeturn0file5).

- **PageSpeed Insights Integration:**  
  Using the Google PageSpeed Insights API, Autostrada fetches performance data for both mobile and desktop strategies. It then uploads raw and merged reports into an AWS S3 bucket.

- **Report Merging & Simplification:**  
  The plugin collects multiple JSON outputs and merges them into a consolidated report. It also extracts a simplified summary of the audit, providing key performance metrics along with aggregated results.

- **Dynamic gRPC Endpoint Configuration:**  
  Communication with Wiphala is configured dynamically based on environment variables and local network parameters. The plugin establishes the gRPC talkback endpoint using a dedicated utility that prioritizes either a fully qualified domain name or the local IP address.

## Requirements  
Before running the plugin, ensure you have installed the following:  

| Requirement                  | Version / Info                                     |
| ---------------------------- | -------------------------------------------------- |
| Node.js                      | Version 16 or higher (based on Node 23 image in Docker) |
| npm (or yarn)                | For dependency management                          |
| NestJS Framework             | Used as underlying microservice framework         |
| AWS Credentials              | Needed to access S3 for uploading reports          |
| Google PageSpeed Insights API Key | To trigger performance audits                |

Also, ensure that the following environment variables are set:

- `GRPC_PORT` (default: 50051)
- `HTTP_PORT` (default: 3000)
- `WIPHALA_GRPC_URL` – The URL to reach the Wiphala gRPC service  
- `ASSETS_BUCKET_NAME` – AWS S3 bucket name for storing reports  
- `PAGE_SPEED_INSIGHTS_KEY` – API key for Google PageSpeed Insights  
- `TALKBACK_FQDN` (optional) – Used to build the gRPC talkback endpoint (citeturn0file10)

## Installation  
Follow these steps to install and get started with the plugin:

1. **Clone the Repository:**  
   ```bash
   git clone https://github.com/gaulatti/wiphala-plugin-autostrada.git
   cd wiphala-plugin-autostrada
   ```

2. **Install Dependencies:**  
   Using npm:  
   ```bash
   npm install
   ```  
   Or using yarn:  
   ```bash
   yarn install
   ```

3. **Configure Environment Variables:**  
   Create a `.env` file in the root directory with the following content (adjust values as needed):
   ```env
   GRPC_PORT=50051
   HTTP_PORT=3000
   WIPHALA_GRPC_URL=0.0.0.0:50051
   ASSETS_BUCKET_NAME=your-s3-bucket-name
   PAGE_SPEED_INSIGHTS_KEY=your-pagespeed-key
   TALKBACK_FQDN=your-talkback-fqdn (optional)
   ```

4. **Build the Application:**  
   Compile the source code using:  
   ```bash
   npm run build
   ```

5. **Run the Application:**  
   To start the gRPC server along with the REST API, run:  
   ```bash
   npm run start:prod
   ```  
   You can also use Docker. A sample `Dockerfile` is provided in the repository (see citeturn0file0), and it exposes the gRPC port dynamically based on the environment settings.

## Usage  
The plugin listens for Worker requests on the gRPC port as defined in the environment variables. It provides two major functionalities:

- **AutostradaCollect:**  
  This method triggers a PageSpeed Insights scan for a given URL, collects the resulting JSON outputs for both mobile and desktop strategies, and immediately uploads these raw results to an AWS S3 bucket (citeturn0file1).

- **AutostradaProcess:**  
  This method processes previously collected scan outputs. It isolates mobile and desktop files from a specified sequence, merges these files into a consolidated report, and sends the simplified results back to Wiphala exclusively over gRPC (citeturn0file7).

All calls to these methods occur via a single gRPC endpoint—**WiphalaService**. This ensures that every operation’s communication is routed strictly through gRPC ports (see citeturn0file9).

Here’s an example of how a Worker client might call the service via gRPC:
```typescript
const request = { payload: JSON.stringify({
  name: 'AutostradaCollect',
  playlist: { slug: 'example-playlist' },
  context: { metadata: { url: 'https://example.com' } }
})};

// Assuming a gRPC client is set-up to reach WorkerService:
workerService.PerformTask(request)
  .subscribe(response => console.log(response));
```

## Configuration  
The plugin uses different configuration files to manage its build and linting processes:

- **TypeScript Configuration:**  
  Files such as `tsconfig.json` and `tsconfig.build.json` define the compilation rules (citeturn0file0).

- **NestJS and Microservice Configuration:**  
  The main module (`app.module.ts`) registers a gRPC client that connects to the Wiphala service using settings provided via environment variables (citeturn0file16).

- **Network Settings:**  
  The plugin obtains the gRPC and HTTP port values from environment variables. A utility in `src/utils/network.ts` ensures that the proper local IP and port combinations are used to build the gRPC talkback endpoint (see citeturn0file3 and citeturn0file11).

Any changes to these configurations should be done via environment variables or by modifying the respective configuration files.

## Contributing  
Contributions to the Autostrada Plugin are most welcome! If you’d like to contribute, please follow these steps:

1. **Fork the Repository:**  
   Create your own fork of the project on GitHub.

2. **Create a Branch:**  
   Use a dedicated branch for your feature or bug fix:
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Implement Your Changes:**  
   Make sure to adhere to the code style and write tests for new functionality. The codebase uses ESLint and Prettier as configured in `.eslint.config.mjs` and `.prettierrc` (citeturn0file6).

4. **Commit Your Changes:**  
   Write clear and descriptive commit messages:
   ```bash
   git commit -m "feat: add new functionality for improved gRPC handling"
   ```

5. **Push and Open a Pull Request:**  
   Push your branch to your fork and open a pull request against the main repository.

6. **Follow Up:**  
   Please respond to any feedback or requested changes during the review process.

Thank you for contributing and helping to enhance the plugin!
