import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import axios from 'axios';

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
  const bucketName = process.env.ASSETS_BUCKET_NAME;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(lighthouseResult),
      ContentType: 'application/json',
    }),
  );

  return key;
};

export { categories, runPageSpeedInsights, strategies };
