/**
 * Represents the result of a Lighthouse audit.
 *
 * @typedef LighthouseResult
 * @property {string} lighthouseVersion - The version of Lighthouse used for the audit.
 * @property {string} fetchTime - The timestamp when the audit was performed.
 * @property {string} requestedUrl - The URL that was requested for the audit.
 * @property {string} finalUrl - The final URL after any redirects.
 * @property {string[]} [runWarnings] - Optional warnings generated during the audit run.
 * @property {Object} environment - Information about the environment in which the audit was run.
 * @property {string} environment.networkUserAgent - The user agent string of the network environment.
 * @property {Object} categories - The scores for various audit categories.
 * @property {Object} [categories.performance] - The performance category score.
 * @property {number} [categories.performance.score] - The performance score (0 to 1).
 * @property {Object} [categories.accessibility] - The accessibility category score.
 * @property {number} [categories.accessibility.score] - The accessibility score (0 to 1).
 * @property {Object} [categories['best-practices']] - The best practices category score.
 * @property {number} [categories['best-practices'].score] - The best practices score (0 to 1).
 * @property {Object} [categories.seo] - The SEO category score.
 * @property {number} [categories.seo.score] - The SEO score (0 to 1).
 * @property {Object.<string, any>} audits - A map of audit results, keyed by audit name.
 * @property {Object} configSettings - Configuration settings used for the audit.
 * @property {string} configSettings.emulatedFormFactor - The emulated form factor (e.g., "mobile" or "desktop").
 * @property {string} configSettings.locale - The locale used for the audit.
 * @property {Object} timing - Timing information for the audit.
 * @property {number} timing.total - The total time taken for the audit, in milliseconds.
 */
export type LighthouseResult = {
  lighthouseVersion: string;
  fetchTime: string;
  requestedUrl: string;
  finalUrl: string;
  runWarnings?: string[];
  environment: {
    networkUserAgent: string;
  };
  categories: {
    performance?: { score: number };
    accessibility?: { score: number };
    'best-practices'?: { score: number };
    seo?: { score: number };
  };
  audits: { [key: string]: any };
  configSettings: {
    emulatedFormFactor: string;
    locale: string;
  };
  timing: {
    total: number;
  };
};

/**
 * Represents a simplified Lighthouse result containing key performance metrics,
 * diagnostics, opportunities for improvement, and configuration details.
 *
 * @typedef SimplifiedLHResult
 * @property {string} lighthouseVersion - The version of Lighthouse used for the audit.
 * @property {string} fetchTime - The timestamp when the audit was performed.
 * @property {string[]} runWarnings - A list of warnings encountered during the audit.
 * @property {string} userAgent - The user agent string used during the audit.
 * @property {string} url - The URL of the page being audited.
 * @property {string} finalUrl - The final URL after any redirects.
 * @property {number} performance - The performance score of the page.
 * @property {number} accessibility - The accessibility score of the page.
 * @property {number} bestPractices - The best practices score of the page.
 * @property {number} seo - The SEO score of the page.
 * @property {Object} timings - Key timing metrics for the page.
 * @property {number} timings.TTFB - Time to First Byte.
 * @property {number} timings.FCP - First Contentful Paint.
 * @property {number} timings.LCP - Largest Contentful Paint.
 * @property {number} timings.DCL - DOM Content Loaded.
 * @property {number} timings.SI - Speed Index.
 * @property {number} timings.CLS - Cumulative Layout Shift.
 * @property {number} timings.TBT - Total Blocking Time.
 * @property {number} timings.TTI - Time to Interactive.
 * @property {Array<Object>} opportunities - A list of improvement opportunities.
 * @property {string} opportunities[].id - The unique identifier for the opportunity.
 * @property {string} opportunities[].title - The title of the opportunity.
 * @property {string} opportunities[].description - A description of the opportunity.
 * @property {string} opportunities[].savings - The estimated savings from implementing the opportunity.
 * @property {Array<Object>} diagnostics - A list of diagnostic details.
 * @property {string} diagnostics[].id - The unique identifier for the diagnostic.
 * @property {string} diagnostics[].title - The title of the diagnostic.
 * @property {string} diagnostics[].description - A description of the diagnostic.
 * @property {any} diagnostics[].details - Additional details about the diagnostic.
 * @property {Object} resourceSummary - A summary of resource usage.
 * @property {number} resourceSummary.totalRequests - The total number of resource requests.
 * @property {number} resourceSummary.totalTransferSize - The total size of transferred resources.
 * @property {Object} resourceSummary.breakdown - A breakdown of resource usage by type.
 * @property {Object} resourceSummary.breakdown[key] - Resource usage for a specific type.
 * @property {number} resourceSummary.breakdown[key].size - The total size of the resource type.
 * @property {number} resourceSummary.breakdown[key].count - The total count of the resource type.
 * @property {Object} config - Configuration details for the audit.
 * @property {string} config.emulatedFormFactor - The emulated form factor (e.g., mobile or desktop).
 * @property {string} config.locale - The locale used during the audit.
 * @property {number} totalAuditTime - The total time taken to perform the audit.
 */
export type SimplifiedLHResult = {
  lighthouseVersion: string;
  fetchTime: string;
  runWarnings: string[];
  userAgent: string;
  url: string;
  finalUrl: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  timings: {
    TTFB: number;
    FCP: number;
    LCP: number;
    DCL: number;
    SI: number;
    CLS: number;
    TBT: number;
    TTI: number;
  };
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    savings: string;
  }>;
  diagnostics: Array<{
    id: string;
    title: string;
    description: string;
    details: any;
  }>;
  resourceSummary: {
    totalRequests: number;
    totalTransferSize: number;
    breakdown: { [key: string]: { size: number; count: number } };
  };
  config: {
    emulatedFormFactor: string;
    locale: string;
  };
  totalAuditTime: number;
};
