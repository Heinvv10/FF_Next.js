// src/modules/ticketing/services/billingCalculator.ts
// Business logic for billing calculation
import { neon } from '@neondatabase/serverless';
import type {
  BillingType,
  BillableCalculation,
  ProjectGuarantee,
  ClientContract,
  BillableFeeSchedule,
} from '../types';

const sql = neon(process.env.DATABASE_URL!);

export interface CalculateBillingParams {
  project_id: string;
  ticket_type: string;
  priority: string;
  dr_number?: string;
  sla_config_id?: string;
  service_type?: string;
}

export class BillingCalculator {
  /**
   * Calculate billing type and cost for a ticket
   * Order of priority:
   * 1. Project Guarantee (free if covered)
   * 2. SLA Contract (covered under monthly fee)
   * 3. Billable (calculate cost from fee schedule)
   */
  static async calculateBilling(
    params: CalculateBillingParams
  ): Promise<BillableCalculation> {
    // Step 1: Check project guarantee
    const guaranteeResult = await this.checkProjectGuarantee(params);
    if (guaranteeResult) {
      return guaranteeResult;
    }

    // Step 2: Check SLA contract
    const slaResult = await this.checkSLAContract(params);
    if (slaResult) {
      return slaResult;
    }

    // Step 3: Calculate billable cost
    const billableResult = await this.calculateBillableCost(params);
    return billableResult;
  }

  /**
   * Check if ticket is covered under project guarantee
   */
  private static async checkProjectGuarantee(
    params: CalculateBillingParams
  ): Promise<BillableCalculation | null> {
    const query = `
      SELECT * FROM project_guarantees
      WHERE project_id = $1
        AND is_active = TRUE
        AND (end_date IS NULL OR end_date > NOW())
        AND (incident_limit IS NULL OR incident_count < incident_limit)
      LIMIT 1
    `;

    const result = await sql.query(query, [params.project_id]);

    if (result.rows.length === 0) {
      return null;
    }

    const guarantee = result.rows[0] as ProjectGuarantee;

    // Check if specific DR number is covered
    if (params.dr_number && guarantee.dr_numbers) {
      if (guarantee.dr_numbers.includes(params.dr_number)) {
        return {
          billing_type: 'guarantee',
          reason: `Drop ${params.dr_number} is covered under project guarantee`,
          estimated_cost: 0,
          requires_approval: false,
          guarantee_id: guarantee.id,
        };
      }
    }

    // Check if service type is covered
    if (
      params.service_type &&
      guarantee.service_types &&
      guarantee.service_types.includes(params.service_type)
    ) {
      return {
        billing_type: 'guarantee',
        reason: `Service type ${params.service_type} is covered under project guarantee`,
        estimated_cost: 0,
        requires_approval: false,
        guarantee_id: guarantee.id,
      };
    }

    return null;
  }

  /**
   * Check if ticket is covered under SLA contract
   */
  private static async checkSLAContract(
    params: CalculateBillingParams
  ): Promise<BillableCalculation | null> {
    if (!params.sla_config_id) {
      return null;
    }

    const contractQuery = `
      SELECT * FROM client_contracts
      WHERE project_id = $1
        AND is_active = TRUE
        AND (end_date IS NULL OR end_date > NOW())
      LIMIT 1
    `;

    const contractResult = await sql.query(contractQuery, [params.project_id]);

    if (contractResult.rows.length === 0) {
      return null;
    }

    const contract = contractResult.rows[0] as ClientContract;

    const slaQuery = `SELECT * FROM sla_configs WHERE id = $1`;
    const slaResult = await sql.query(slaQuery, [params.sla_config_id]);

    if (slaResult.rows.length === 0) {
      return null;
    }

    const estimatedCost = contract.monthly_fee
      ? parseFloat((contract.monthly_fee / 30).toFixed(2))
      : null;

    return {
      billing_type: 'sla',
      reason: `Service covered under SLA contract (${contract.contract_number})`,
      estimated_cost: estimatedCost,
      requires_approval: false,
      contract_id: contract.id,
      sla_config_id: params.sla_config_id,
    };
  }

  /**
   * Calculate billable cost from fee schedule
   */
  private static async calculateBillableCost(
    params: CalculateBillingParams
  ): Promise<BillableCalculation> {
    const query = `
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

    const result = await sql.query(query, [
      params.service_type || params.ticket_type,
      params.ticket_type,
      params.priority,
      params.project_id,
    ]);

    if (result.rows.length > 0) {
      const fee = result.rows[0] as BillableFeeSchedule;

      const baseFee = fee.base_fee ? parseFloat(fee.base_fee.toString()) : 0;
      const requiresApproval = baseFee > 1000;

      return {
        billing_type: 'billable',
        reason: 'Billable service based on fee schedule',
        estimated_cost: baseFee,
        requires_approval: requiresApproval,
        fee_schedule_id: fee.id,
        hourly_rate: fee.hourly_rate
          ? parseFloat(fee.hourly_rate.toString())
          : undefined,
        travel_fee: fee.travel_fee
          ? parseFloat(fee.travel_fee.toString())
          : undefined,
      };
    }

    // Default fallback
    return {
      billing_type: 'billable',
      reason: 'No specific fee schedule found - default billable rate',
      estimated_cost: 500,
      requires_approval: true,
    };
  }

  /**
   * Calculate total cost for ticket with breakdown
   */
  static calculateTotalCost(params: {
    base_cost?: number;
    labor_hours?: number;
    labor_cost?: number;
    hourly_rate?: number;
    materials_cost?: number;
    travel_cost?: number;
    other_costs?: number;
  }): {
    total_cost: number;
    breakdown: {
      base: number;
      labor: number;
      materials: number;
      travel: number;
      other: number;
    };
  } {
    const base = params.base_cost || 0;
    const labor =
      params.labor_cost ||
      (params.labor_hours && params.hourly_rate
        ? params.labor_hours * params.hourly_rate
        : 0);
    const materials = params.materials_cost || 0;
    const travel = params.travel_cost || 0;
    const other = params.other_costs || 0;

    const total = base + labor + materials + travel + other;

    return {
      total_cost: parseFloat(total.toFixed(2)),
      breakdown: {
        base: parseFloat(base.toFixed(2)),
        labor: parseFloat(labor.toFixed(2)),
        materials: parseFloat(materials.toFixed(2)),
        travel: parseFloat(travel.toFixed(2)),
        other: parseFloat(other.toFixed(2)),
      },
    };
  }
}
