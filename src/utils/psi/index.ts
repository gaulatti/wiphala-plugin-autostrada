import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import axios from 'axios';
import { LighthouseResult, SimplifiedLHResult } from 'src/types/lighthouse';
import { Readable } from 'stream';
import { mergeFiles } from '../files';
import { streamToString } from '../s3';

/**
 * An instance of the `S3Client` class used to interact with Amazon S3.
 * This client provides methods for performing operations such as uploading,
 * downloading, and managing objects in S3 buckets.
 *
 * Ensure that the AWS SDK is properly configured with the necessary credentials
 * and region before using this client.
 */
const s3Client = new S3Client();

/**
 * PageSpeed Insights categories.
 */
const categories = ['performance', 'seo', 'accessibility', 'best-practices'];

/**
 * PageSpeed Insights strategies.
 */
const strategies = ['mobile', 'desktop'];

/**
 * This function is the entry point for the worker.
 */
const API_URL =
  'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed';

/**
 * Executes a PageSpeed Insights scan for a given URL and uploads the results to an S3 bucket.
 *
 * @param slug - A unique identifier for the scan, typically used for naming the S3 object.
 * @param url - The URL to be analyzed by PageSpeed Insights.
 * @param category - The category of the analysis (e.g., "performance", "accessibility").
 * @param strategy - The strategy for the analysis (e.g., "mobile", "desktop").
 * @returns A promise that resolves to the S3 object key where the results are stored.
 *
 * @throws Will throw an error if the PageSpeed Insights API request fails or if the S3 upload fails.
 */
const runPageSpeedInsights = async (
  slug: string,
  url: string,
  category: string,
  strategy: string,
) => {
  /**
   * Fetch data from PageSpeed Insights.
   */
  const response = await axios.get(API_URL, {
    params: {
      key: process.env.PAGE_SPEED_INSIGHTS_KEY,
      url,
      strategy,
      category,
    },
  });

  const lighthouseResult = response.data.lighthouseResult;

  /**
   * Upload the data to S3.
   */
  const date = new Date();
  const key = `scans/${date.getUTCFullYear()}/${date.getMonth() + 1}/${slug}.${category}.${strategy}.json`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.ASSETS_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(lighthouseResult),
      ContentType: 'application/json',
    }),
  );

  return key;
};

/**
 * Merges multiple output files for a given strategy, uploads the consolidated
 * file to S3, and generates a simplified summary file.
 *
 * @param slug - A unique identifier for the operation, typically representing the scan or entity.
 * @param strategy - The strategy type, either 'mobile' or 'desktop', indicating the context of the files.
 * @param files - An array of file paths to be merged.
 * @returns An object containing the simplified summary file and the paths to the full and minimized files in S3.
 *
 * The function performs the following steps:
 * 1. Retrieves the contents of the specified files from S3.
 * 2. Merges the contents of the files into a single consolidated file.
 * 3. Uploads the consolidated file to S3 in JSON format.
 * 4. Extracts a simplified summary from the consolidated file and uploads it to S3.
 */
const mergeOutputFiles = async (
  slug: string,
  strategy: 'mobile' | 'desktop',
  files: string[],
) => {
  /**
   * Get all contents for the strategy from S3
   */
  const contents: string[] = await Promise.all(
    files.map((file: string) => getOutputFileFromS3(file)),
  );

  /**
   * Merge files as they're complimentary.
   */
  const mergedFile = mergeFiles(contents);
  const date = new Date();

  /**
   * Upload to S3 as consolidated file.
   */
  const basePath = `scans/${date.getUTCFullYear()}/${date.getMonth() + 1}/${slug}.${strategy}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.ASSETS_BUCKET_NAME,
      Key: `${basePath}.json`,
      Body: JSON.stringify(mergedFile),
      ContentType: 'application/json',
    }),
  );

  /**
   * Upload the simplified file to s3.
   */
  const simplifiedFile = extractLighthouseSummary(mergedFile, strategy);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.ASSETS_BUCKET_NAME,
      Key: `${basePath}.min.json`,
      Body: JSON.stringify(simplifiedFile),
      ContentType: 'application/json',
    }),
  );

  return {
    simplifiedFile,
    files: { full: `${basePath}.json`, min: `${basePath}.min.json` },
  };
};

/**
 * Retrieves a file from an S3 bucket and converts its content to a string.
 *
 * @param path - The key (path) of the file in the S3 bucket.
 * @returns A promise that resolves to the content of the file as a string.
 *
 * @throws Will throw an error if the S3 client fails to retrieve the object.
 */
const getOutputFileFromS3 = async (path: string) => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.ASSETS_BUCKET_NAME,
      Key: path,
    }),
  );
  return await streamToString(response.Body as Readable);
};

/**
 * Extracts a simplified summary from a raw Lighthouse JSON report.
 *
 * @param rawData - The raw Lighthouse JSON report as a string.
 * @param mode - The mode in which the Lighthouse report was generated, either 'desktop' or 'mobile'.
 * @returns An object containing the simplified Lighthouse result.
 *
 * The returned `simplifiedResult` includes:
 * - `mode`: The mode of the report ('desktop' or 'mobile').
 * - `lighthouseVersion`: The version of Lighthouse used.
 * - `fetchTime`: The timestamp when the report was generated.
 * - `runWarnings`: Any warnings generated during the Lighthouse run.
 * - `userAgent`: The user agent string used during the Lighthouse run.
 * - `url`: The URL of the page being audited.
 * - `finalUrl`: The final URL after any redirects.
 * - `performance`, `accessibility`, `bestPractices`, `seo`: Scores for respective categories (scaled to 0-100).
 * - `timings`: Key performance metrics such as TTFB, FCP, LCP, DCL, SI, CLS, TBT, and TTI.
 * - `opportunities`: A list of opportunities to improve performance, including savings in milliseconds.
 * - `diagnostics`: A list of diagnostic audits with additional details.
 * - `resourceSummary`: A summary of resource usage, including total requests, transfer size, and a breakdown by resource type.
 * - `config`: Configuration settings used in the Lighthouse run, such as emulated form factor and locale.
 * - `totalAuditTime`: The total time taken to perform the Lighthouse audit.
 */
const extractLighthouseSummary = (
  lhReport: LighthouseResult,
  mode: 'desktop' | 'mobile',
): SimplifiedLHResult => {
  const metricsData = lhReport.audits['metrics']?.details?.items?.[0] || {};
  const simplifiedResult: SimplifiedLHResult = {
    mode,
    lighthouseVersion: lhReport.lighthouseVersion,
    fetchTime: lhReport.fetchTime,
    runWarnings: lhReport.runWarnings || [],
    userAgent: lhReport.environment.networkUserAgent,
    url: lhReport.requestedUrl,
    finalUrl: lhReport.finalUrl,
    performance: (lhReport.categories.performance?.score || 0) * 100,
    accessibility: (lhReport.categories.accessibility?.score || 0) * 100,
    bestPractices: (lhReport.categories['best-practices']?.score || 0) * 100,
    seo: (lhReport.categories.seo?.score || 0) * 100,
    timings: {
      TTFB: metricsData.timeToFirstByte || 0,
      FCP: lhReport.audits['first-contentful-paint']?.numericValue || 0,
      LCP: lhReport.audits['largest-contentful-paint']?.numericValue || 0,
      DCL: metricsData.observedDomContentLoaded || 0,
      SI: lhReport.audits['speed-index']?.numericValue || 0,
      CLS: lhReport.audits['cumulative-layout-shift']?.numericValue || 0,
      TBT: lhReport.audits['total-blocking-time']?.numericValue || 0,
      TTI: lhReport.audits['interactive']?.numericValue || 0,
    },
    opportunities: Object.keys(lhReport.audits)
      .filter((key) => lhReport.audits[key].details?.type === 'opportunity')
      .map((key) => ({
        id: key,
        title: lhReport.audits[key].title,
        description: lhReport.audits[key].description,
        savings: `${lhReport.audits[key].details.overallSavingsMs || 0}ms`,
      })),
    diagnostics: Object.keys(lhReport.audits)
      .filter((key) => lhReport.audits[key].details?.type === 'diagnostic')
      .map((key) => ({
        id: key,
        title: lhReport.audits[key].title,
        description: lhReport.audits[key].description,
        details: lhReport.audits[key].details,
      })),
    resourceSummary: {
      totalRequests:
        lhReport.audits['resource-summary']?.details?.items?.length || 0,
      totalTransferSize: (
        lhReport.audits['resource-summary']?.details?.items || []
      ).reduce((acc: number, item: any) => acc + (item.transferSize || 0), 0),
      breakdown: (
        lhReport.audits['resource-summary']?.details?.items || []
      ).reduce((acc: any, item: any) => {
        if (item.resourceType) {
          if (!acc[item.resourceType]) {
            acc[item.resourceType] = { size: 0, count: 0 };
          }
          acc[item.resourceType].size += item.transferSize || 0;
          acc[item.resourceType].count += 1;
        }
        return acc;
      }, {}),
    },
    config: {
      emulatedFormFactor: lhReport.configSettings.emulatedFormFactor,
      locale: lhReport.configSettings.locale,
    },
    totalAuditTime: lhReport.timing.total || 0,
  };

  return simplifiedResult;
};

export {
  categories,
  extractLighthouseSummary,
  mergeOutputFiles,
  runPageSpeedInsights,
  strategies,
};
