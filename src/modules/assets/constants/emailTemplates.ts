/**
 * Email Template Constants
 *
 * Templates for asset management email notifications.
 */

export const EmailTemplateType = {
  CALIBRATION_DUE_7_DAYS: 'calibration_due_7_days',
  CALIBRATION_DUE_TODAY: 'calibration_due_today',
  CALIBRATION_OVERDUE: 'calibration_overdue',
  MAINTENANCE_DUE_7_DAYS: 'maintenance_due_7_days',
  MAINTENANCE_DUE_TODAY: 'maintenance_due_today',
  MAINTENANCE_OVERDUE: 'maintenance_overdue',
  ASSET_CHECKOUT: 'asset_checkout',
  ASSET_CHECKIN: 'asset_checkin',
  RETURN_OVERDUE: 'return_overdue',
} as const;

export type EmailTemplateTypeValue = (typeof EmailTemplateType)[keyof typeof EmailTemplateType];

export interface EmailTemplateData {
  assetName: string;
  assetNumber: string;
  dueDate?: string;
  assigneeName?: string;
  location?: string;
  notes?: string;
}

export const EMAIL_TEMPLATES: Record<
  EmailTemplateTypeValue,
  {
    subject: string;
    getBody: (data: EmailTemplateData) => string;
  }
> = {
  [EmailTemplateType.CALIBRATION_DUE_7_DAYS]: {
    subject: 'Calibration Due in 7 Days: {assetName}',
    getBody: (data) => `
      <h2>Calibration Reminder</h2>
      <p>The following asset is due for calibration in 7 days:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Asset Number:</strong> ${data.assetNumber}</li>
        <li><strong>Due Date:</strong> ${data.dueDate}</li>
      </ul>
      <p>Please schedule calibration to ensure continued accuracy and compliance.</p>
    `,
  },
  [EmailTemplateType.CALIBRATION_DUE_TODAY]: {
    subject: 'Calibration Due Today: {assetName}',
    getBody: (data) => `
      <h2>Calibration Due Today</h2>
      <p>The following asset is due for calibration today:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Asset Number:</strong> ${data.assetNumber}</li>
      </ul>
      <p>Please arrange for calibration immediately.</p>
    `,
  },
  [EmailTemplateType.CALIBRATION_OVERDUE]: {
    subject: '⚠️ OVERDUE Calibration: {assetName}',
    getBody: (data) => `
      <h2 style="color: red;">Calibration Overdue</h2>
      <p>The following asset has an overdue calibration:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Asset Number:</strong> ${data.assetNumber}</li>
        <li><strong>Was Due:</strong> ${data.dueDate}</li>
      </ul>
      <p><strong>This asset should not be used for testing until calibrated.</strong></p>
    `,
  },
  [EmailTemplateType.MAINTENANCE_DUE_7_DAYS]: {
    subject: 'Maintenance Due in 7 Days: {assetName}',
    getBody: (data) => `
      <h2>Maintenance Reminder</h2>
      <p>The following asset is due for maintenance in 7 days:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Asset Number:</strong> ${data.assetNumber}</li>
        <li><strong>Due Date:</strong> ${data.dueDate}</li>
      </ul>
      <p>Please schedule maintenance to prevent unexpected downtime.</p>
    `,
  },
  [EmailTemplateType.MAINTENANCE_DUE_TODAY]: {
    subject: 'Maintenance Due Today: {assetName}',
    getBody: (data) => `
      <h2>Maintenance Due Today</h2>
      <p>The following asset is due for maintenance today:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Asset Number:</strong> ${data.assetNumber}</li>
      </ul>
    `,
  },
  [EmailTemplateType.MAINTENANCE_OVERDUE]: {
    subject: '⚠️ OVERDUE Maintenance: {assetName}',
    getBody: (data) => `
      <h2 style="color: red;">Maintenance Overdue</h2>
      <p>The following asset has overdue maintenance:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Asset Number:</strong> ${data.assetNumber}</li>
        <li><strong>Was Due:</strong> ${data.dueDate}</li>
      </ul>
    `,
  },
  [EmailTemplateType.ASSET_CHECKOUT]: {
    subject: 'Asset Checked Out: {assetName}',
    getBody: (data) => `
      <h2>Asset Checkout Confirmation</h2>
      <p>The following asset has been checked out:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Asset Number:</strong> ${data.assetNumber}</li>
        <li><strong>Checked Out To:</strong> ${data.assigneeName}</li>
        ${data.notes ? `<li><strong>Notes:</strong> ${data.notes}</li>` : ''}
      </ul>
    `,
  },
  [EmailTemplateType.ASSET_CHECKIN]: {
    subject: 'Asset Returned: {assetName}',
    getBody: (data) => `
      <h2>Asset Return Confirmation</h2>
      <p>The following asset has been returned:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Asset Number:</strong> ${data.assetNumber}</li>
        <li><strong>Returned By:</strong> ${data.assigneeName}</li>
        ${data.location ? `<li><strong>Location:</strong> ${data.location}</li>` : ''}
      </ul>
    `,
  },
  [EmailTemplateType.RETURN_OVERDUE]: {
    subject: '⚠️ Asset Return Overdue: {assetName}',
    getBody: (data) => `
      <h2 style="color: red;">Asset Return Overdue</h2>
      <p>The following asset was expected to be returned but is still checked out:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Asset Number:</strong> ${data.assetNumber}</li>
        <li><strong>Assigned To:</strong> ${data.assigneeName}</li>
        <li><strong>Expected Return:</strong> ${data.dueDate}</li>
      </ul>
      <p>Please follow up on the return of this asset.</p>
    `,
  },
};

/**
 * Render email subject with data
 */
export function renderEmailSubject(
  templateType: EmailTemplateTypeValue,
  data: EmailTemplateData
): string {
  return EMAIL_TEMPLATES[templateType].subject
    .replace('{assetName}', data.assetName)
    .replace('{assetNumber}', data.assetNumber);
}

/**
 * Render email body with data
 */
export function renderEmailBody(
  templateType: EmailTemplateTypeValue,
  data: EmailTemplateData
): string {
  return EMAIL_TEMPLATES[templateType].getBody(data);
}
