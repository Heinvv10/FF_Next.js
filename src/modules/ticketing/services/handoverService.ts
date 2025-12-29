/**
 * Handover Service
 *
 * 🟢 WORKING: Production-ready handover service for ticket ownership transfer
 *
 * Provides:
 * - Validate handover gates (as-built, photos, ONT/PON, contractor)
 * - Create immutable handover snapshots
 * - Transfer ownership between teams (Build → QA → Maintenance)
 * - Get handover history for tickets
 * - Check if ticket can be handed over
 *
 * Features:
 * - Input validation
 * - SQL injection prevention (parameterized queries)
 * - Immutable snapshot creation with JSONB data
 * - Gate validation with different strictness levels
 * - Comprehensive audit trail
 */

import { query, queryOne, transaction } from '../utils/db';
import {
  HandoverSnapshot,
  CreateHandoverSnapshotPayload,
  HandoverGateValidation,
  HandoverGateCheck,
  HandoverBlocker,
  HandoverGateName,
  HandoverType,
  OwnerType,
  TicketHandoverHistory,
  EvidenceLink,
  HandoverDecision,
  HandoverSnapshotData
} from '../types/handover';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ticketing:handover');

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validate handover gates for a ticket
 * 🟢 WORKING: Comprehensive gate validation with strictness levels
 *
 * Gates validated:
 * - AS_BUILT_CONFIRMED: DR, pole, PON, zone populated
 * - PHOTOS_ARCHIVED: Photos exist for ticket
 * - ONT_PON_VERIFIED: ONT serial and RX level recorded
 * - CONTRACTOR_ASSIGNED: Contractor assigned to ticket
 * - VERIFICATION_COMPLETE: All verification steps completed
 *
 * @param ticketId - Ticket UUID
 * @param handoverType - Type of handover (affects strictness)
 * @returns Gate validation result with pass/fail status
 */
export async function validateHandoverGate(
  ticketId: string,
  handoverType: HandoverType
): Promise<HandoverGateValidation> {
  logger.info('Validating handover gates', {
    ticket_id: ticketId,
    handover_type: handoverType
  });

  try {
    // 🟢 WORKING: Fetch ticket data
    const ticketSql = `
      SELECT * FROM tickets WHERE id = $1
    `;
    const ticket = await queryOne<any>(ticketSql, [ticketId]);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // 🟢 WORKING: Fetch attachments (photos)
    const attachmentsSql = `
      SELECT * FROM ticket_attachments
      WHERE ticket_id = $1 AND file_type = 'photo'
    `;
    const attachments = await query<any>(attachmentsSql, [ticketId]);

    // 🟢 WORKING: Fetch verification steps
    const verificationSql = `
      SELECT * FROM verification_steps
      WHERE ticket_id = $1
      ORDER BY step_number
    `;
    const verificationSteps = await query<any>(verificationSql, [ticketId]);

    // Determine strictness based on handover type
    const isStrict = handoverType === HandoverType.QA_TO_MAINTENANCE;

    const gatesPassed: HandoverGateCheck[] = [];
    const gatesFailed: HandoverGateCheck[] = [];
    const blockingIssues: HandoverBlocker[] = [];
    const warnings: string[] = [];

    // 🟢 WORKING: Gate 1 - AS_BUILT_CONFIRMED
    const hasAllAsBuiltData = !!(
      ticket.dr_number &&
      ticket.zone_id &&
      ticket.pole_number &&
      ticket.pon_number
    );
    const hasMinimalAsBuiltData = !!(ticket.dr_number && ticket.zone_id);

    const asBuiltGate: HandoverGateCheck = {
      gate_name: HandoverGateName.AS_BUILT_CONFIRMED,
      passed: isStrict ? hasAllAsBuiltData : hasMinimalAsBuiltData,
      required: isStrict,
      message: hasAllAsBuiltData
        ? 'As-built data confirmed (DR, zone, pole, PON populated)'
        : hasMinimalAsBuiltData
        ? 'As-built data partially complete (DR and zone populated)'
        : 'Missing as-built data (DR number or zone)'
    };

    if (asBuiltGate.passed) {
      gatesPassed.push(asBuiltGate);
      // Add warnings for missing optional fields in non-strict mode
      if (!isStrict && !hasAllAsBuiltData) {
        if (!ticket.pole_number) {
          warnings.push('Pole number not populated - should be completed before QA handover');
        }
        if (!ticket.pon_number) {
          warnings.push('PON number not populated - should be completed before QA handover');
        }
      }
    } else {
      gatesFailed.push(asBuiltGate);
      if (isStrict) {
        blockingIssues.push({
          gate_name: HandoverGateName.AS_BUILT_CONFIRMED,
          severity: 'critical',
          message: 'DR number, zone, pole, and PON must be populated',
          resolution_hint: 'Update ticket with complete as-built data'
        });
      } else {
        warnings.push('As-built data incomplete - should be populated before QA');
      }
    }

    // 🟢 WORKING: Gate 2 - PHOTOS_ARCHIVED
    const photosGate: HandoverGateCheck = {
      gate_name: HandoverGateName.PHOTOS_ARCHIVED,
      passed: attachments.length > 0,
      required: true,
      message: attachments.length > 0
        ? `Photos archived (${attachments.length} photos)`
        : 'No photos archived'
    };

    if (photosGate.passed) {
      gatesPassed.push(photosGate);
    } else {
      gatesFailed.push(photosGate);
      blockingIssues.push({
        gate_name: HandoverGateName.PHOTOS_ARCHIVED,
        severity: 'critical',
        message: 'At least one photo must be uploaded',
        resolution_hint: 'Upload photo evidence to ticket attachments'
      });
    }

    // 🟢 WORKING: Gate 3 - ONT_PON_VERIFIED
    const ontPonGate: HandoverGateCheck = {
      gate_name: HandoverGateName.ONT_PON_VERIFIED,
      passed: !!(ticket.ont_serial && (ticket.ont_rx_level !== null)),
      required: isStrict,
      message: ticket.ont_serial && (ticket.ont_rx_level !== null)
        ? `ONT/PON verified (Serial: ${ticket.ont_serial}, RX: ${ticket.ont_rx_level} dBm)`
        : 'ONT serial or RX level missing'
    };

    if (ontPonGate.passed) {
      gatesPassed.push(ontPonGate);
    } else {
      gatesFailed.push(ontPonGate);
      if (isStrict) {
        blockingIssues.push({
          gate_name: HandoverGateName.ONT_PON_VERIFIED,
          severity: 'high',
          message: 'ONT serial and RX power level must be recorded',
          resolution_hint: 'Update ticket with ONT serial number and RX power level'
        });
      } else {
        warnings.push('ONT/PON details incomplete - required for maintenance handover');
      }
    }

    // 🟢 WORKING: Gate 4 - CONTRACTOR_ASSIGNED
    const contractorGate: HandoverGateCheck = {
      gate_name: HandoverGateName.CONTRACTOR_ASSIGNED,
      passed: !!ticket.assigned_contractor_id,
      required: isStrict,
      message: ticket.assigned_contractor_id
        ? 'Contractor assigned'
        : 'No contractor assigned'
    };

    if (contractorGate.passed) {
      gatesPassed.push(contractorGate);
    } else {
      gatesFailed.push(contractorGate);
      if (isStrict) {
        blockingIssues.push({
          gate_name: HandoverGateName.CONTRACTOR_ASSIGNED,
          severity: 'high',
          message: 'Contractor must be assigned for maintenance tracking',
          resolution_hint: 'Assign contractor to ticket'
        });
      } else {
        warnings.push('No contractor assigned - recommended for tracking');
      }
    }

    // 🟢 WORKING: Gate 5 - VERIFICATION_COMPLETE
    const completedSteps = verificationSteps.filter((s: any) => s.is_complete).length;
    const totalSteps = verificationSteps.length;
    const verificationGate: HandoverGateCheck = {
      gate_name: HandoverGateName.VERIFICATION_COMPLETE,
      passed: totalSteps > 0 && completedSteps === totalSteps,
      required: false, // Warning only
      message: totalSteps > 0
        ? `Verification ${completedSteps === totalSteps ? 'complete' : 'incomplete'} (${completedSteps}/${totalSteps})`
        : 'No verification steps defined'
    };

    if (verificationGate.passed) {
      gatesPassed.push(verificationGate);
    } else {
      gatesFailed.push(verificationGate);
      if (totalSteps > 0) {
        warnings.push(`Verification incomplete (${completedSteps}/${totalSteps} steps complete)`);
      }
    }

    // 🟢 WORKING: Determine if handover can proceed
    const canHandover = blockingIssues.length === 0;

    logger.info('Gate validation complete', {
      ticket_id: ticketId,
      can_handover: canHandover,
      gates_passed: gatesPassed.length,
      gates_failed: gatesFailed.length,
      blocking_issues: blockingIssues.length
    });

    return {
      can_handover: canHandover,
      blocking_issues: blockingIssues,
      warnings: warnings,
      gates_passed: gatesPassed,
      gates_failed: gatesFailed
    };
  } catch (error) {
    logger.error('Failed to validate handover gates', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticket_id: ticketId
    });
    throw error;
  }
}

/**
 * Create handover snapshot
 * 🟢 WORKING: Creates immutable audit trail of ticket state at handover
 *
 * @param payload - Handover creation data
 * @returns Created handover snapshot with locked status
 * @throws {Error} If validation fails or ticket not found
 */
export async function createHandoverSnapshot(
  payload: CreateHandoverSnapshotPayload
): Promise<HandoverSnapshot> {
  // 🟢 WORKING: Validate required fields
  if (!payload.ticket_id) {
    throw new Error('ticket_id is required');
  }

  if (!payload.handover_type) {
    throw new Error('handover_type is required');
  }

  if (!payload.handover_by) {
    throw new Error('handover_by is required');
  }

  logger.info('Creating handover snapshot', {
    ticket_id: payload.ticket_id,
    handover_type: payload.handover_type,
    from_owner: payload.from_owner_type,
    to_owner: payload.to_owner_type
  });

  try {
    // 🟢 WORKING: Use transaction for atomic snapshot creation
    return await transaction(async (txn) => {
      // Fetch ticket data
      const ticketSql = `SELECT * FROM tickets WHERE id = $1`;
      const ticket = await txn.queryOne<any>(ticketSql, [payload.ticket_id]);

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // 🟢 WORKING: Fetch all evidence links (photos and documents)
      const attachmentsSql = `
        SELECT
          id,
          filename,
          file_type,
          storage_url,
          uploaded_at,
          uploaded_by,
          verification_step_id
        FROM ticket_attachments
        WHERE ticket_id = $1
        ORDER BY uploaded_at ASC
      `;
      const attachments = await txn.query<any>(attachmentsSql, [payload.ticket_id]);

      // Map to evidence links
      const evidenceLinks: EvidenceLink[] = attachments.map((att: any) => ({
        type: att.file_type === 'photo' ? 'photo' : 'document',
        step_number: null, // Can be enhanced to map verification_step_id to step_number
        url: att.storage_url,
        filename: att.filename,
        uploaded_at: att.uploaded_at,
        uploaded_by: att.uploaded_by
      }));

      // 🟢 WORKING: Fetch verification steps
      const verificationSql = `
        SELECT * FROM verification_steps
        WHERE ticket_id = $1
        ORDER BY step_number
      `;
      const verificationSteps = await txn.query<any>(verificationSql, [payload.ticket_id]);

      const completedSteps = verificationSteps.filter((s: any) => s.is_complete).length;
      const totalSteps = verificationSteps.length;

      // 🟢 WORKING: Fetch QA decisions (approvals, rejections, risk acceptances)
      const risksSql = `
        SELECT
          id,
          risk_type,
          risk_description,
          status,
          accepted_by,
          accepted_at,
          resolved_at,
          resolved_by
        FROM qa_risk_acceptances
        WHERE ticket_id = $1
        ORDER BY created_at ASC
      `;
      const risks = await txn.query<any>(risksSql, [payload.ticket_id]);

      // Map to decisions
      const decisions: HandoverDecision[] = risks.map((risk: any) => ({
        decision_type: 'risk_acceptance' as const,
        decision_by: risk.accepted_by,
        decision_at: risk.accepted_at,
        notes: risk.risk_description,
        metadata: {
          risk_id: risk.id,
          risk_type: risk.risk_type,
          status: risk.status
        }
      }));

      // 🟢 WORKING: Build snapshot data (immutable record of ticket state)
      const snapshotData: HandoverSnapshotData = {
        ticket_uid: ticket.ticket_uid,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        ticket_type: ticket.ticket_type,
        dr_number: ticket.dr_number,
        project_id: ticket.project_id,
        zone_id: ticket.zone_id,
        pole_number: ticket.pole_number,
        pon_number: ticket.pon_number,
        address: ticket.address,
        ont_serial: ticket.ont_serial,
        ont_rx_level: ticket.ont_rx_level,
        ont_model: ticket.ont_model,
        assigned_to: ticket.assigned_to,
        assigned_contractor_id: ticket.assigned_contractor_id,
        assigned_team: ticket.assigned_team,
        qa_ready: ticket.qa_ready,
        qa_readiness_check_at: ticket.qa_readiness_check_at,
        fault_cause: ticket.fault_cause,
        fault_cause_details: ticket.fault_cause_details,
        verification_steps_completed: completedSteps,
        verification_steps_total: totalSteps,
        snapshot_timestamp: new Date()
      };

      // 🟢 WORKING: Insert handover snapshot
      const insertSql = `
        INSERT INTO handover_snapshots (
          ticket_id,
          handover_type,
          snapshot_data,
          evidence_links,
          decisions,
          guarantee_status,
          from_owner_type,
          from_owner_id,
          to_owner_type,
          to_owner_id,
          handover_by,
          is_locked
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const snapshot = await txn.queryOne<HandoverSnapshot>(insertSql, [
        payload.ticket_id,
        payload.handover_type,
        JSON.stringify(snapshotData),
        JSON.stringify(evidenceLinks),
        JSON.stringify(decisions),
        ticket.guarantee_status || null,
        payload.from_owner_type || null,
        payload.from_owner_id || null,
        payload.to_owner_type || null,
        payload.to_owner_id || null,
        payload.handover_by,
        true // Always locked
      ]);

      if (!snapshot) {
        throw new Error('Failed to create handover snapshot');
      }

      logger.info('Handover snapshot created successfully', {
        snapshot_id: snapshot.id,
        ticket_id: payload.ticket_id,
        handover_type: payload.handover_type
      });

      return snapshot;
    });
  } catch (error) {
    logger.error('Failed to create handover snapshot', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticket_id: payload.ticket_id
    });
    throw error;
  }
}

/**
 * Get handover history for a ticket
 * 🟢 WORKING: Retrieves all handover snapshots for a ticket
 *
 * @param ticketId - Ticket UUID
 * @returns Handover history with all snapshots and current owner
 */
export async function getHandoverHistory(
  ticketId: string
): Promise<TicketHandoverHistory> {
  logger.debug('Getting handover history', { ticket_id: ticketId });

  try {
    // Verify ticket exists
    const ticketSql = `SELECT ticket_uid FROM tickets WHERE id = $1`;
    const ticket = await queryOne<{ ticket_uid: string }>(ticketSql, [ticketId]);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // 🟢 WORKING: Fetch all handover snapshots
    const sql = `
      SELECT * FROM handover_snapshots
      WHERE ticket_id = $1
      ORDER BY handover_at ASC
    `;

    const handovers = await query<HandoverSnapshot>(sql, [ticketId]);

    // 🟢 WORKING: Determine current owner from latest handover
    const latestHandover = handovers.length > 0 ? handovers[handovers.length - 1] : null;

    logger.debug('Handover history retrieved', {
      ticket_id: ticketId,
      handover_count: handovers.length
    });

    return {
      ticket_id: ticketId,
      ticket_uid: ticket.ticket_uid,
      handovers: handovers,
      total_handovers: handovers.length,
      current_owner_type: latestHandover?.to_owner_type || null,
      current_owner_id: latestHandover?.to_owner_id || null
    };
  } catch (error) {
    logger.error('Failed to get handover history', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticket_id: ticketId
    });
    throw error;
  }
}

/**
 * Get handover snapshot by ID
 * 🟢 WORKING: Retrieve specific handover snapshot
 *
 * @param handoverId - Handover snapshot UUID
 * @returns Handover snapshot or null if not found
 * @throws {Error} If invalid UUID format
 */
export async function getHandoverById(
  handoverId: string
): Promise<HandoverSnapshot | null> {
  // 🟢 WORKING: Validate UUID format
  if (!isValidUUID(handoverId)) {
    throw new Error('Invalid handover ID format');
  }

  logger.debug('Fetching handover by ID', { handover_id: handoverId });

  try {
    const sql = `SELECT * FROM handover_snapshots WHERE id = $1`;
    const snapshot = await queryOne<HandoverSnapshot>(sql, [handoverId]);

    return snapshot;
  } catch (error) {
    logger.error('Failed to get handover by ID', {
      error: error instanceof Error ? error.message : 'Unknown error',
      handover_id: handoverId
    });
    throw error;
  }
}

/**
 * Check if ticket can be handed over
 * 🟢 WORKING: Quick check for handover eligibility
 *
 * @param ticketId - Ticket UUID
 * @param handoverType - Type of handover to check
 * @returns true if ticket can be handed over, false otherwise
 */
export async function canHandover(
  ticketId: string,
  handoverType: HandoverType
): Promise<boolean> {
  logger.debug('Checking if ticket can handover', {
    ticket_id: ticketId,
    handover_type: handoverType
  });

  try {
    const validation = await validateHandoverGate(ticketId, handoverType);

    logger.info('Handover eligibility check result', {
      ticket_id: ticketId,
      can_handover: validation.can_handover,
      blocking_issues: validation.blocking_issues.length
    });

    return validation.can_handover;
  } catch (error) {
    logger.error('Failed to check handover eligibility', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ticket_id: ticketId
    });
    throw error;
  }
}
