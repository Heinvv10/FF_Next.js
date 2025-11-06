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
 */
async function findNextRow(
  accessToken: string,
  config: SharePointConfig
): Promise<number> {
  const rangeUrl = `${GRAPH_API_BASE}/drives/${config.driveId}/items/${config.fileId}/workbook/worksheets/${config.worksheetName}/range(address='B1:B2000')`;

  const response = await fetch(rangeUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get range: ${response.statusText}`);
  }

  const data = await response.json();
  const values = data.values || [];

  // Find last non-empty row
  let lastRow = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i][0]) {
      lastRow = i + 1;
    }
  }

  return lastRow + 1; // Next available row
}

/**
 * Write daily drops to SharePoint
 */
async function syncToSharePoint(
  accessToken: string,
  config: SharePointConfig,
  drops: Array<{ date: string; project: string; count: number }>
): Promise<void> {
  // Find next available row
  const nextRow = await findNextRow(accessToken, config);

  // Write each project's data
  for (let i = 0; i < drops.length; i++) {
    const drop = drops[i];
    const rowNum = nextRow + i;
    const rangeAddr = `A${rowNum}:C${rowNum}`;

    const updateUrl = `${GRAPH_API_BASE}/drives/${config.driveId}/items/${config.fileId}/workbook/worksheets/${config.worksheetName}/range(address='${rangeAddr}')`;

    const values = [[drop.date, drop.project, drop.count]];

    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update row ${rowNum}: ${response.statusText}`);
    }

    // Rate limiting - wait 500ms between writes
    await new Promise(resolve => setTimeout(resolve, 500));
  }
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

    // Get daily drops
    const dailyDrops = await getDailyDropsPerProject();

    if (dailyDrops.length === 0) {
      return apiResponse.success(res, {
        synced: 0,
        message: 'No drops to sync today',
      });
    }

    // Get access token
    const accessToken = await getAccessToken(config);

    // Sync to SharePoint
    await syncToSharePoint(accessToken, config, dailyDrops);

    return apiResponse.success(res, {
      synced: dailyDrops.length,
      message: `Successfully synced ${dailyDrops.length} project(s) to SharePoint`,
      date: new Date().toISOString().split('T')[0],
    });

  } catch (error: any) {
    console.error('Error syncing to SharePoint:', error);
    return apiResponse.internalError(res, error, 'Failed to sync to SharePoint');
  }
}
