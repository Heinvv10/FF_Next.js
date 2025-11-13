/**
 * WA Monitor SharePoint Sync API
 * POST /api/wa-monitor-sync-sharepoint
 *
 * Syncs daily drops per project to SharePoint (NeonDbase sheet)
 * Columns: A = date, B = project, C = total no of drops submitted
 *
 * SharePoint URL: https://blitzfibre.sharepoint.com/:x:/s/Velocity_Manco/EYm7g0w6Y1dFgGB_m4YlBxgBeVJpoDXAYjdvK-ZfgHoOqA
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { getDailyDropsPerProject } from '@/modules/wa-monitor/services/waMonitorService';

// Microsoft Graph API configuration
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

interface SharePointConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteId: string;
  driveId: string;
  fileId: string;
  worksheetName: string;
}

/**
 * Get SharePoint configuration from environment variables
 */
function getSharePointConfig(): SharePointConfig | null {
  const tenantId = process.env.SHAREPOINT_TENANT_ID;
  const clientId = process.env.SHAREPOINT_CLIENT_ID;
  const clientSecret = process.env.SHAREPOINT_CLIENT_SECRET;
  const siteId = process.env.SHAREPOINT_SITE_ID;
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  const fileId = process.env.SHAREPOINT_FILE_ID;
  const worksheetName = process.env.SHAREPOINT_WORKSHEET_NAME || 'NeonDbase';

  if (!tenantId || !clientId || !clientSecret || !siteId || !driveId || !fileId) {
    return null;
  }

  return { tenantId, clientId, clientSecret, siteId, driveId, fileId, worksheetName };
}

/**
 * Get OAuth access token for Microsoft Graph API
 */
async function getAccessToken(config: SharePointConfig): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Find the next available row in the worksheet
 * Uses usedRange to be more efficient with large files
 */
async function findNextRow(
  accessToken: string,
  config: SharePointConfig
): Promise<number> {
  // Use usedRange to get only cells with data (much faster for large files)
  const rangeUrl = `${GRAPH_API_BASE}/drives/${config.driveId}/items/${config.fileId}/workbook/worksheets/${config.worksheetName}/usedRange`;

  // Use AbortController with 120 second timeout for large files
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(rangeUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // If worksheet is empty, usedRange returns 404
      if (response.status === 404) {
        return 1; // Start at row 1 for empty worksheet
      }
      throw new Error(`Failed to get range: ${response.statusText}`);
    }

    const data = await response.json();
    const rowCount = data.rowCount || 0;

    // Next row is one after the last used row
    return rowCount + 1;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Timeout reading Excel file (120s). File may be too large.');
    }
    throw error;
  }
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Write single row to SharePoint with retry
 */
async function writeRowWithRetry(
  accessToken: string,
  config: SharePointConfig,
  rowNum: number,
  data: { date: string; project: string; count: number }
): Promise<void> {
  const rangeAddr = `A${rowNum}:C${rowNum}`;
  const updateUrl = `${GRAPH_API_BASE}/drives/${config.driveId}/items/${config.fileId}/workbook/worksheets/${config.worksheetName}/range(address='${rangeAddr}')`;

  await retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout (large Excel file)

    try {
      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [[data.date, data.project, data.count]] }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeout);
      throw error;
    }
  }, 3, 2000); // 3 retries, 2s base delay
}

/**
 * Write daily drops to SharePoint with retry logic
 */
async function syncToSharePoint(
  accessToken: string,
  config: SharePointConfig,
  drops: Array<{ date: string; project: string; count: number }>
): Promise<{ succeeded: number; failed: number }> {
  // Find next available row
  const nextRow = await findNextRow(accessToken, config);

  let succeeded = 0;
  let failed = 0;

  // Write each project's data with retry
  for (let i = 0; i < drops.length; i++) {
    const drop = drops[i];
    const rowNum = nextRow + i;

    try {
      await writeRowWithRetry(accessToken, config, rowNum, drop);
      succeeded++;
      console.log(`✅ Wrote ${drop.project}: ${drop.count} drops to row ${rowNum}`);
    } catch (error: any) {
      failed++;
      console.error(`❌ Failed to write ${drop.project} to row ${rowNum}:`, error.message);
    }

    // Rate limiting - wait 1s between writes
    if (i < drops.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { succeeded, failed };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res, req.method || 'UNKNOWN', ['POST']);
  }

  try {
    // Get SharePoint configuration
    const config = getSharePointConfig();
    if (!config) {
      return apiResponse.validationError(res, {
        sharepoint: 'SharePoint configuration missing. Check environment variables.',
      });
    }

    // Get date from request body (optional, defaults to today)
    const { date } = req.body || {};

    // Get daily drops for specified date or today
    const dailyDrops = await getDailyDropsPerProject(date);

    if (dailyDrops.length === 0) {
      const dateStr = date || new Date().toISOString().split('T')[0];
      return apiResponse.success(res, {
        synced: 0,
        message: `No drops to sync for ${dateStr}`,
        date: dateStr,
      });
    }

    // Get access token
    const accessToken = await getAccessToken(config);

    // Sync to SharePoint with retry logic
    const result = await syncToSharePoint(accessToken, config, dailyDrops);

    // Determine response based on results
    const message = result.failed === 0
      ? `Successfully synced ${result.succeeded}/${dailyDrops.length} project(s) to SharePoint`
      : `Synced ${result.succeeded}/${dailyDrops.length} project(s) (${result.failed} failed)`;

    return apiResponse.success(res, {
      succeeded: result.succeeded,
      failed: result.failed,
      total: dailyDrops.length,
      message,
      date: new Date().toISOString().split('T')[0],
      projects: dailyDrops, // Include project details for email
    });

  } catch (error: any) {
    console.error('Error syncing to SharePoint:', error);
    return apiResponse.internalError(res, error, 'Failed to sync to SharePoint');
  }
}
