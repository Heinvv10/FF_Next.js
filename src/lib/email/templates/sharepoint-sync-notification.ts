/**
 * SharePoint Sync Notification Email Template
 * Used for daily WA Monitor sync status notifications
 */

export interface SharePointSyncData {
  status: 'success' | 'failure' | 'partial';
  date: string;
  succeeded: number;
  failed: number;
  total: number;
  message: string;
  error?: string;
  duration?: string;
}

export function generateSharePointSyncEmail(data: SharePointSyncData): string {
  const statusEmoji = data.status === 'success' ? '✅' : data.status === 'partial' ? '⚠️' : '❌';
  const statusColor = data.status === 'success' ? '#10b981' : data.status === 'partial' ? '#f59e0b' : '#ef4444';
  const statusText = data.status === 'success' ? 'Success' : data.status === 'partial' ? 'Partial Success' : 'Failed';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SharePoint Sync - ${statusText}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: ${statusColor}; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${statusEmoji} WA Monitor SharePoint Sync
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Daily Sync Report - ${data.date}
              </p>
            </td>
          </tr>

          <!-- Status -->
          <tr>
            <td style="padding: 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid ${statusColor};">
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">
                      Status: ${statusText}
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
                      ${data.message}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Stats -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">
                Sync Statistics
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px; background-color: #f0fdf4; border-radius: 6px; width: 33%;">
                    <p style="margin: 0; font-size: 12px; color: #166534; font-weight: 500;">SUCCEEDED</p>
                    <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #15803d;">${data.succeeded}</p>
                  </td>
                  <td style="width: 2%;"></td>
                  <td style="padding: 12px; background-color: #fef2f2; border-radius: 6px; width: 33%;">
                    <p style="margin: 0; font-size: 12px; color: #991b1b; font-weight: 500;">FAILED</p>
                    <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #dc2626;">${data.failed}</p>
                  </td>
                  <td style="width: 2%;"></td>
                  <td style="padding: 12px; background-color: #f3f4f6; border-radius: 6px; width: 33%;">
                    <p style="margin: 0; font-size: 12px; color: #374151; font-weight: 500;">TOTAL</p>
                    <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #1f2937;">${data.total}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${data.duration ? `
          <!-- Duration -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>Duration:</strong> ${data.duration}
              </p>
            </td>
          </tr>
          ` : ''}

          ${data.error ? `
          <!-- Error Details -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 16px; background-color: #fef2f2; border-radius: 6px; border-left: 4px solid #ef4444;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #991b1b;">
                      Error Details
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #7f1d1d; font-family: 'Courier New', monospace;">
                      ${data.error}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                FibreFlow WA Monitor | SharePoint Sync Automation<br>
                <a href="https://app.fibreflow.app/wa-monitor" style="color: #2563eb; text-decoration: none;">View Dashboard</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateSharePointSyncPlainText(data: SharePointSyncData): string {
  const statusText = data.status === 'success' ? 'SUCCESS' : data.status === 'partial' ? 'PARTIAL SUCCESS' : 'FAILED';

  let text = `
WA Monitor SharePoint Sync Report
Date: ${data.date}
Status: ${statusText}

${data.message}

Statistics:
- Succeeded: ${data.succeeded}
- Failed: ${data.failed}
- Total: ${data.total}
`;

  if (data.duration) {
    text += `\nDuration: ${data.duration}`;
  }

  if (data.error) {
    text += `\n\nError Details:\n${data.error}`;
  }

  text += `\n\nView Dashboard: https://app.fibreflow.app/wa-monitor`;

  return text.trim();
}
