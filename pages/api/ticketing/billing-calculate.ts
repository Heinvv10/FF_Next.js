// pages/api/ticketing/billing-calculate.ts
// Calculate billing type for a ticket based on business rules
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';
import type { BillableCalculation, BillingType } from '@/modules/ticketing/types';

const sql = neon(process.env.DATABASE_URL!);

interface CalculateBillingInput {
  ticket_id?: string; // Calculate for existing ticket
  project_id: string;
  ticket_type: string;
  priority: string;
  dr_number?: string; // If provided, check drop guarantee status
  sla_config_id?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res, ['POST']);
  }

  const { userId } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  return handleCalculateBilling(req, res, userId);
}

async function handleCalculateBilling(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const input = req.body as CalculateBillingInput;

    if (!input.project_id) {
      return apiResponse.badRequest(res, 'project_id is required');
    }

    if (!input.ticket_type) {
      return apiResponse.badRequest(res, 'ticket_type is required');
    }

    if (!input.priority) {
      return apiResponse.badRequest(res, 'priority is required');
    }

    let billing_type: BillingType = 'billable';
    let reason = 'Default billable service';
    let estimated_cost: number | null = null;
    let requires_approval = false;

    // Step 1: Check project guarantee
    const guaranteeQuery = `
      SELECT * FROM project_guarantees
      WHERE project_id = $1
        AND is_active = TRUE
        AND (end_date IS NULL OR end_date > NOW())
        AND (incident_limit IS NULL OR incident_count < incident_limit)
      LIMIT 1
    `;

    const guaranteeResult = await sql.query(guaranteeQuery, [input.project_id]);

    if (guaranteeResult.rows.length > 0) {
      const guarantee = guaranteeResult.rows[0];

      if (input.dr_number) {
        const isGuaranteedQuery = `
          SELECT * FROM project_guarantees
          WHERE project_id = $1
            AND $2 = ANY(dr_numbers)
            AND is_active = TRUE
        `;

        const isGuaranteedResult = await sql.query(isGuaranteedQuery, [
          input.project_id,
          input.dr_number,
        ]);

        if (isGuaranteedResult.rows.length > 0) {
          billing_type = 'guarantee';
          reason = `Drop ${input.dr_number} is covered under project guarantee`;
          estimated_cost = 0;
          return apiResponse.success(res, {
            billing_type,
            reason,
            estimated_cost,
            requires_approval,
            guarantee_id: guarantee.id,
          } as BillableCalculation);
        }
      }

      if (
        guarantee.service_types &&
        guarantee.service_types.includes(input.ticket_type)
      ) {
        billing_type = 'guarantee';
        reason = `Service type ${input.ticket_type} is covered under project guarantee`;
        estimated_cost = 0;
        return apiResponse.success(res, {
          billing_type,
          reason,
          estimated_cost,
          requires_approval,
          guarantee_id: guarantee.id,
        } as BillableCalculation);
      }
    }

    // Step 2: Check SLA contract
    if (input.sla_config_id) {
      const contractQuery = `
        SELECT cc.* FROM client_contracts cc
        WHERE cc.project_id = $1
          AND cc.is_active = TRUE
          AND (cc.end_date IS NULL OR cc.end_date > NOW())
        LIMIT 1
      `;

      const contractResult = await sql.query(contractQuery, [input.project_id]);

      if (contractResult.rows.length > 0) {
        const contract = contractResult.rows[0];

        const slaQuery = `SELECT * FROM sla_configs WHERE id = $1`;
        const slaResult = await sql.query(slaQuery, [input.sla_config_id]);

        if (slaResult.rows.length > 0) {
          billing_type = 'sla';
          reason = `Service covered under SLA contract (${contract.contract_number})`;
          estimated_cost = contract.monthly_fee
            ? contract.monthly_fee / 30
            : null;

          return apiResponse.success(res, {
            billing_type,
            reason,
            estimated_cost,
            requires_approval: false,
            contract_id: contract.id,
            sla_config_id: input.sla_config_id,
          } as BillableCalculation);
        }
      }
    }

    // Step 3: Calculate billable cost
    const feeScheduleQuery = `
      SELECT * FROM billable_fee_schedule
      WHERE (service_type = $1 OR service_type IS NULL)
        AND (ticket_type = $2 OR ticket_type IS NULL)
        AND (priority = $3 OR priority IS NULL)
        AND (project_id = $4 OR project_id IS NULL)
        AND is_active = TRUE
      ORDER BY
        CASE
          WHEN project_id IS NOT NULL THEN 1
          WHEN service_type IS NOT NULL THEN 2
          WHEN ticket_type IS NOT NULL THEN 3
          WHEN priority IS NOT NULL THEN 4
          ELSE 5
        END
      LIMIT 1
    `;

    const feeScheduleResult = await sql.query(feeScheduleQuery, [
      input.ticket_type,
      input.ticket_type,
      input.priority,
      input.project_id,
    ]);

    if (feeScheduleResult.rows.length > 0) {
      const fee = feeScheduleResult.rows[0];
      billing_type = 'billable';
      reason = 'Billable service based on fee schedule';

      estimated_cost = fee.base_fee || 0;

      if (fee.base_fee && fee.base_fee > 1000) {
        requires_approval = true;
      }

      return apiResponse.success(res, {
        billing_type,
        reason,
        estimated_cost,
        requires_approval,
        fee_schedule_id: fee.id,
        hourly_rate: fee.hourly_rate,
        travel_fee: fee.travel_fee,
      } as BillableCalculation);
    }

    billing_type = 'billable';
    reason = 'No specific fee schedule found - default billable rate';
    estimated_cost = 500;
    requires_approval = true;

    return apiResponse.success(res, {
      billing_type,
      reason,
      estimated_cost,
      requires_approval,
    } as BillableCalculation);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
