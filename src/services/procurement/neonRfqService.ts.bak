/**
 * Comprehensive Neon RFQ Service
 * Complete RFQ lifecycle management using Neon PostgreSQL
 * Replaces all Firebase-based RFQ services
 */

import { neon } from '@neondatabase/serverless';
import { log } from '@/lib/logger';
import { 
  RFQ, 
  RFQFormData, 
  RFQStatus,
  RFQResponse,
  RFQItem,
  RFQNotification
} from '@/types/procurement.types';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL!);

/**
 * Comprehensive RFQ Service for Neon
 */
export class NeonRFQService {
  // ============= CRUD OPERATIONS =============
  
  /**
   * Create new RFQ with items
   */
  static async create(data: RFQFormData): Promise<string> {
    try {
      // Generate unique RFQ number
      const rfqNumber = await this.generateRFQNumber(data.projectId);
      
      // Start transaction
      const rfqResult = await sql`
        INSERT INTO rfqs (
          project_id, rfq_number, title, description, status,
          issue_date, response_deadline, closing_date,
          invited_suppliers, payment_terms, delivery_terms,
          validity_period, currency, technical_requirements,
          total_budget_estimate, created_by
        ) VALUES (
          ${data.projectId},
          ${rfqNumber},
          ${data.title},
          ${data.description || ''},
          ${data.status || RFQStatus.DRAFT},
          ${new Date().toISOString()},
          ${data.responseDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()},
          ${data.closingDate || data.responseDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()},
          ${JSON.stringify(data.supplierIds || [])},
          ${data.paymentTerms || 'Net 30 days'},
          ${data.deliveryTerms || 'Ex Works'},
          ${data.validityPeriod || 30},
          ${data.currency || 'ZAR'},
          ${data.technicalRequirements || ''},
          ${data.totalBudgetEstimate || 0},
          ${data.createdBy || 'system'}
        )
        RETURNING id`;
      
      const rfqId = rfqResult[0].id;
      
      // Add items if provided
      if (data.items && data.items.length > 0) {
        await this.addItems(rfqId, data.items);
      }
      
      // Create initial notification for creation
      await this.createNotification(rfqId, {
        type: 'created',
        recipientType: 'internal',
        subject: `New RFQ Created: ${rfqNumber}`,
        message: `RFQ ${rfqNumber} has been created for project ${data.projectId}`
      });
      
      log.info('RFQ created successfully', { rfqId, rfqNumber }, 'neonRfqService');
      return rfqId;
    } catch (error) {
      log.error('Error creating RFQ:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Get RFQ by ID with all related data
   */
  static async getById(id: string): Promise<RFQ> {
    try {
      const rfqResult = await sql`
        SELECT 
          r.*,
          COUNT(DISTINCT ri.id) as item_count,
          COUNT(DISTINCT rr.id) as response_count,
          COUNT(DISTINCT rn.id) as notification_count
        FROM rfqs r
        LEFT JOIN rfq_items ri ON r.id = ri.rfq_id
        LEFT JOIN rfq_responses rr ON r.id = rr.rfq_id
        LEFT JOIN rfq_notifications rn ON r.id = rn.rfq_id
        WHERE r.id = ${id}
        GROUP BY r.id`;
      
      if (rfqResult.length === 0) {
        throw new Error('RFQ not found');
      }
      
      // Get items
      const items = await this.getItems(id);
      
      // Get responses
      const responses = await this.getResponses(id);
      
      const rfq = rfqResult[0];
      return {
        id: rfq.id,
        projectId: rfq.project_id,
        rfqNumber: rfq.rfq_number,
        title: rfq.title,
        description: rfq.description,
        status: rfq.status as RFQStatus,
        issueDate: rfq.issue_date,
        responseDeadline: rfq.response_deadline,
        closingDate: rfq.closing_date,
        invitedSuppliers: JSON.parse(rfq.invited_suppliers || '[]'),
        items,
        responses,
        itemCount: parseInt(rfq.item_count) || 0,
        responseCount: parseInt(rfq.response_count) || 0,
        paymentTerms: rfq.payment_terms,
        deliveryTerms: rfq.delivery_terms,
        validityPeriod: rfq.validity_period || 30,
        currency: rfq.currency || 'ZAR',
        technicalRequirements: rfq.technical_requirements,
        totalBudgetEstimate: rfq.total_budget_estimate,
        createdBy: rfq.created_by,
        createdAt: rfq.created_at,
        updatedAt: rfq.updated_at
      } as RFQ;
    } catch (error) {
      log.error('Error fetching RFQ:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Update RFQ
   */
  static async update(id: string, data: Partial<RFQFormData>): Promise<void> {
    try {
      const updateFields = [];
      const values = [];
      
      if (data.title !== undefined) {
        updateFields.push('title');
        values.push(data.title);
      }
      if (data.description !== undefined) {
        updateFields.push('description');
        values.push(data.description);
      }
      if (data.responseDeadline !== undefined) {
        updateFields.push('response_deadline');
        values.push(new Date(data.responseDeadline).toISOString());
      }
      if (data.closingDate !== undefined) {
        updateFields.push('closing_date');
        values.push(new Date(data.closingDate).toISOString());
      }
      if (data.supplierIds !== undefined) {
        updateFields.push('invited_suppliers');
        values.push(JSON.stringify(data.supplierIds));
      }
      if (data.paymentTerms !== undefined) {
        updateFields.push('payment_terms');
        values.push(data.paymentTerms);
      }
      if (data.deliveryTerms !== undefined) {
        updateFields.push('delivery_terms');
        values.push(data.deliveryTerms);
      }
      if (data.technicalRequirements !== undefined) {
        updateFields.push('technical_requirements');
        values.push(data.technicalRequirements);
      }
      if (data.totalBudgetEstimate !== undefined) {
        updateFields.push('total_budget_estimate');
        values.push(data.totalBudgetEstimate);
      }
      
      if (updateFields.length > 0) {
        updateFields.push('updated_at');
        values.push(new Date().toISOString());
        
        const setClause = updateFields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        values.push(id);
        
        await sql(`UPDATE rfqs SET ${setClause} WHERE id = $${values.length}`, values);
      }
      
      log.info('RFQ updated successfully', { rfqId: id }, 'neonRfqService');
    } catch (error) {
      log.error('Error updating RFQ:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Delete RFQ
   */
  static async delete(id: string): Promise<void> {
    try {
      await sql`DELETE FROM rfqs WHERE id = ${id}`;
      log.info('RFQ deleted successfully', { rfqId: id }, 'neonRfqService');
    } catch (error) {
      log.error('Error deleting RFQ:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  // ============= LIFECYCLE MANAGEMENT =============

  /**
   * Send RFQ to suppliers (transition from DRAFT to ISSUED)
   */
  static async sendToSuppliers(id: string, supplierIds?: string[]): Promise<void> {
    try {
      const rfq = await this.getById(id);
      
      // Validate status transition
      if (!this.validateStatusTransition(rfq.status, RFQStatus.ISSUED)) {
        throw new Error(`Cannot transition from ${rfq.status} to ${RFQStatus.ISSUED}`);
      }
      
      const suppliers = supplierIds || rfq.invitedSuppliers;
      
      // Update RFQ status and invited suppliers
      await sql`
        UPDATE rfqs 
        SET 
          status = ${RFQStatus.ISSUED},
          invited_suppliers = ${JSON.stringify(suppliers)},
          issue_date = ${new Date().toISOString()},
          sent_at = ${new Date().toISOString()},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${id}`;
      
      // Create notifications for each supplier
      for (const supplierId of suppliers) {
        await this.createSupplierNotification(id, supplierId, 'invitation');
      }
      
      log.info('RFQ sent to suppliers', { rfqId: id, supplierCount: suppliers.length }, 'neonRfqService');
    } catch (error) {
      log.error('Error sending RFQ to suppliers:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Submit supplier response
   */
  static async submitResponse(rfqId: string, response: any): Promise<string> {
    try {
      const responseNumber = await this.generateResponseNumber(rfqId);
      
      const result = await sql`
        INSERT INTO rfq_responses (
          rfq_id, supplier_id, supplier_name, response_number,
          total_amount, currency, validity_period,
          payment_terms, delivery_terms, delivery_date,
          status, attachments, technical_compliance,
          commercial_terms, notes
        ) VALUES (
          ${rfqId},
          ${response.supplierId},
          ${response.supplierName},
          ${responseNumber},
          ${response.totalAmount},
          ${response.currency || 'ZAR'},
          ${response.validityPeriod || 30},
          ${response.paymentTerms || ''},
          ${response.deliveryTerms || ''},
          ${response.deliveryDate ? new Date(response.deliveryDate).toISOString() : null},
          'submitted',
          ${JSON.stringify(response.attachments || [])},
          ${response.technicalCompliance || true},
          ${JSON.stringify(response.commercialTerms || {})},
          ${response.notes || ''}
        )
        RETURNING id`;
      
      const responseId = result[0].id;
      
      // Add response items if provided
      if (response.items && response.items.length > 0) {
        for (const item of response.items) {
          await sql`
            INSERT INTO rfq_response_items (
              response_id, rfq_item_id, unit_price, total_price,
              discount_percent, delivery_days, compliance_status,
              alternative_offered, alternative_description, notes
            ) VALUES (
              ${responseId},
              ${item.rfqItemId},
              ${item.unitPrice},
              ${item.totalPrice || item.quantity * item.unitPrice},
              ${item.discountPercent || 0},
              ${item.deliveryDays || 0},
              ${item.complianceStatus || 'compliant'},
              ${item.alternativeOffered || false},
              ${item.alternativeDescription || ''},
              ${item.notes || ''}
            )`;
        }
      }
      
      // Update RFQ status if first response
      const responseCount = await sql`
        SELECT COUNT(*) as count FROM rfq_responses WHERE rfq_id = ${rfqId}`;
      
      if (responseCount[0].count === 1) {
        await this.updateStatus(rfqId, RFQStatus.RESPONSES_RECEIVED);
      }
      
      // Create notification
      await this.createNotification(rfqId, {
        type: 'response_received',
        recipientType: 'internal',
        subject: `Response received for RFQ`,
        message: `Supplier ${response.supplierName} has submitted a response`
      });
      
      log.info('RFQ response submitted', { rfqId, responseId }, 'neonRfqService');
      return responseId;
    } catch (error) {
      log.error('Error submitting RFQ response:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Select winning response and award RFQ
   */
  static async selectResponse(rfqId: string, responseId: string, reason?: string): Promise<void> {
    try {
      // Update response as selected
      await sql`
        UPDATE rfq_responses 
        SET 
          status = 'accepted',
          evaluation_status = 'winner',
          reviewed_at = ${new Date().toISOString()}
        WHERE id = ${responseId}`;
      
      // Update other responses as not selected
      await sql`
        UPDATE rfq_responses 
        SET 
          status = 'rejected',
          evaluation_status = 'not_selected'
        WHERE rfq_id = ${rfqId} AND id != ${responseId}`;
      
      // Update RFQ with selection
      await sql`
        UPDATE rfqs 
        SET 
          selected_response_id = ${responseId},
          selection_reason = ${reason || ''},
          status = ${RFQStatus.AWARDED},
          awarded_date = ${new Date().toISOString()},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${rfqId}`;
      
      // Create award notification
      await this.createNotification(rfqId, {
        type: 'award',
        recipientType: 'all',
        subject: `RFQ Awarded`,
        message: `RFQ has been awarded to the selected supplier`
      });
      
      log.info('RFQ response selected', { rfqId, responseId }, 'neonRfqService');
    } catch (error) {
      log.error('Error selecting RFQ response:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Close RFQ
   */
  static async closeRFQ(rfqId: string, reason: string): Promise<void> {
    try {
      await sql`
        UPDATE rfqs 
        SET 
          status = ${RFQStatus.CLOSED},
          closed_at = ${new Date().toISOString()},
          closure_reason = ${reason},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${rfqId}`;
      
      log.info('RFQ closed', { rfqId, reason }, 'neonRfqService');
    } catch (error) {
      log.error('Error closing RFQ:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Cancel RFQ
   */
  static async cancelRFQ(rfqId: string, reason: string): Promise<void> {
    try {
      await sql`
        UPDATE rfqs 
        SET 
          status = ${RFQStatus.CANCELLED},
          cancelled_at = ${new Date().toISOString()},
          cancellation_reason = ${reason},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${rfqId}`;
      
      // Notify all invited suppliers
      await this.createNotification(rfqId, {
        type: 'cancellation',
        recipientType: 'all',
        subject: `RFQ Cancelled`,
        message: `RFQ has been cancelled. Reason: ${reason}`
      });
      
      log.info('RFQ cancelled', { rfqId, reason }, 'neonRfqService');
    } catch (error) {
      log.error('Error cancelling RFQ:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Extend RFQ deadline
   */
  static async extendDeadline(rfqId: string, newDeadline: Date, reason?: string): Promise<void> {
    try {
      const rfq = await this.getById(rfqId);
      
      await sql`
        UPDATE rfqs 
        SET 
          response_deadline = ${newDeadline.toISOString()},
          closing_date = ${newDeadline.toISOString()},
          deadline_extensions = ${JSON.stringify({
            extendedAt: new Date().toISOString(),
            reason: reason || 'Deadline extended',
            previousDeadline: rfq.responseDeadline
          })},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${rfqId}`;
      
      // Notify suppliers of deadline extension
      await this.createNotification(rfqId, {
        type: 'deadline_extended',
        recipientType: 'all',
        subject: `RFQ Deadline Extended`,
        message: `The deadline for RFQ ${rfq.rfqNumber} has been extended to ${newDeadline.toLocaleDateString()}`
      });
      
      log.info('RFQ deadline extended', { rfqId, newDeadline }, 'neonRfqService');
    } catch (error) {
      log.error('Error extending RFQ deadline:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  // ============= WORKFLOW OPERATIONS =============

  /**
   * Evaluate responses
   */
  static async evaluateResponses(rfqId: string): Promise<any> {
    try {
      const responses = await this.getResponses(rfqId);
      
      if (responses.length === 0) {
        throw new Error('No responses to evaluate');
      }
      
      // Get evaluation criteria
      const criteria = await sql`
        SELECT * FROM rfq_evaluation_criteria 
        WHERE rfq_id = ${rfqId}
        ORDER BY weight DESC`;
      
      // Calculate scores for each response
      const evaluatedResponses = await Promise.all(responses.map(async (response) => {
        let totalScore = 0;
        let weightedScore = 0;
        
        for (const criterion of criteria) {
          // Calculate score based on criterion type
          let score = 0;
          
          switch (criterion.criteria_type) {
            case 'price':
              // Lowest price gets highest score
              const minPrice = Math.min(...responses.map(r => r.totalAmount));
              score = (minPrice / response.totalAmount) * criterion.max_score;
              break;
            
            case 'delivery':
              // Fastest delivery gets highest score
              const minDays = Math.min(...responses.map(r => r.deliveryDays || 30));
              score = (minDays / (response.deliveryDays || 30)) * criterion.max_score;
              break;
            
            default:
              // Default scoring (would be manual in real scenario)
              score = criterion.max_score * 0.7;
          }
          
          const weightedCriterionScore = score * (criterion.weight / 100);
          
          // Save evaluation score
          await sql`
            INSERT INTO rfq_evaluation_scores (
              response_id, criteria_id, score, weighted_score
            ) VALUES (
              ${response.id},
              ${criterion.id},
              ${score},
              ${weightedCriterionScore}
            )
            ON CONFLICT (response_id, criteria_id) 
            DO UPDATE SET 
              score = ${score},
              weighted_score = ${weightedCriterionScore},
              updated_at = ${new Date().toISOString()}`;
          
          totalScore += score;
          weightedScore += weightedCriterionScore;
        }
        
        // Update response with evaluation scores
        await sql`
          UPDATE rfq_responses 
          SET 
            evaluation_score = ${totalScore},
            evaluation_status = 'evaluated',
            evaluated_at = ${new Date().toISOString()}
          WHERE id = ${response.id}`;
        
        return {
          ...response,
          totalScore,
          weightedScore
        };
      }));
      
      // Update RFQ status
      await this.updateStatus(rfqId, RFQStatus.EVALUATED);
      
      // Sort by weighted score
      evaluatedResponses.sort((a, b) => b.weightedScore - a.weightedScore);
      
      return {
        responses: evaluatedResponses,
        recommended: evaluatedResponses[0],
        criteria
      };
    } catch (error) {
      log.error('Error evaluating RFQ responses:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Compare responses
   */
  static async compareResponses(rfqId: string): Promise<any> {
    try {
      const responses = await this.getResponses(rfqId);
      
      if (responses.length === 0) {
        throw new Error('No responses to compare');
      }
      
      const comparison = {
        responses,
        lowestPrice: responses.reduce((min, r) => 
          r.totalAmount < min.totalAmount ? r : min
        ),
        fastestDelivery: responses.reduce((min, r) => 
          (r.deliveryDays || 999) < (min.deliveryDays || 999) ? r : min
        ),
        bestPaymentTerms: responses.reduce((best, r) => {
          const currentDays = parseInt(best.paymentTerms?.match(/\d+/)?.[0] || '0');
          const newDays = parseInt(r.paymentTerms?.match(/\d+/)?.[0] || '0');
          return newDays > currentDays ? r : best;
        }),
        statistics: {
          averagePrice: responses.reduce((sum, r) => sum + r.totalAmount, 0) / responses.length,
          priceRange: {
            min: Math.min(...responses.map(r => r.totalAmount)),
            max: Math.max(...responses.map(r => r.totalAmount))
          },
          averageDeliveryDays: responses.reduce((sum, r) => sum + (r.deliveryDays || 0), 0) / responses.length
        }
      };
      
      return comparison;
    } catch (error) {
      log.error('Error comparing RFQ responses:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  // ============= NOTIFICATION SYSTEM =============

  /**
   * Create notification
   */
  static async createNotification(rfqId: string, notification: any): Promise<void> {
    try {
      await sql`
        INSERT INTO rfq_notifications (
          rfq_id, notification_type, recipient_type,
          recipient_id, recipient_email, subject, message,
          status, metadata
        ) VALUES (
          ${rfqId},
          ${notification.type},
          ${notification.recipientType},
          ${notification.recipientId || null},
          ${notification.recipientEmail || null},
          ${notification.subject},
          ${notification.message},
          'pending',
          ${JSON.stringify(notification.metadata || {})}
        )`;
      
      // Trigger email/webhook sending (async)
      this.sendNotification(notification).catch(error => {
        log.error('Failed to send notification:', { data: error }, 'neonRfqService');
      });
    } catch (error) {
      log.error('Error creating notification:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Create supplier-specific notification
   */
  static async createSupplierNotification(rfqId: string, supplierId: string, type: string): Promise<void> {
    try {
      // Get supplier details
      const supplier = await sql`
        SELECT * FROM suppliers WHERE id = ${supplierId}`;
      
      if (supplier.length === 0) {
        log.warn('Supplier not found for notification', { supplierId }, 'neonRfqService');
        return;
      }
      
      const rfq = await this.getById(rfqId);
      
      await this.createNotification(rfqId, {
        type,
        recipientType: 'supplier',
        recipientId: supplierId,
        recipientEmail: supplier[0].email,
        subject: `RFQ ${rfq.rfqNumber}: ${type}`,
        message: this.getNotificationMessage(type, rfq),
        metadata: {
          supplierName: supplier[0].company_name,
          rfqNumber: rfq.rfqNumber
        }
      });
    } catch (error) {
      log.error('Error creating supplier notification:', { data: error }, 'neonRfqService');
    }
  }

  /**
   * Send notification (email/webhook)
   */
  private static async sendNotification(notification: any): Promise<void> {
    try {
      // This would integrate with your email service (SendGrid, AWS SES, etc.)
      // or webhook service
      
      // For now, just log the notification
      log.info('Sending notification', notification, 'neonRfqService');
      
      // Update notification status
      if (notification.id) {
        await sql`
          UPDATE rfq_notifications 
          SET 
            status = 'sent',
            sent_at = ${new Date().toISOString()}
          WHERE id = ${notification.id}`;
      }
    } catch (error) {
      log.error('Error sending notification:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Send deadline reminders
   */
  static async sendDeadlineReminders(): Promise<void> {
    try {
      // Find RFQs with approaching deadlines (24 hours)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const rfqs = await sql`
        SELECT * FROM rfqs 
        WHERE status = ${RFQStatus.ISSUED}
        AND response_deadline BETWEEN NOW() AND ${tomorrow.toISOString()}
        AND NOT EXISTS (
          SELECT 1 FROM rfq_notifications 
          WHERE rfq_id = rfqs.id 
          AND notification_type = 'deadline_reminder'
          AND created_at > NOW() - INTERVAL '24 hours'
        )`;
      
      for (const rfq of rfqs) {
        await this.createNotification(rfq.id, {
          type: 'deadline_reminder',
          recipientType: 'all',
          subject: `RFQ ${rfq.rfq_number} - Deadline Approaching`,
          message: `The deadline for RFQ ${rfq.rfq_number} is approaching. Please submit your response before ${new Date(rfq.response_deadline).toLocaleString()}`
        });
      }
      
      log.info(`Sent deadline reminders for ${rfqs.length} RFQs`, {}, 'neonRfqService');
    } catch (error) {
      log.error('Error sending deadline reminders:', { data: error }, 'neonRfqService');
    }
  }

  // ============= HELPER METHODS =============

  /**
   * Generate unique RFQ number
   */
  private static async generateRFQNumber(projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await sql`
      SELECT COUNT(*) as count FROM rfqs 
      WHERE project_id = ${projectId}
      AND EXTRACT(YEAR FROM created_at) = ${year}`;
    
    const sequence = (parseInt(count[0].count) + 1).toString().padStart(4, '0');
    return `RFQ-${year}-${projectId.slice(0, 4).toUpperCase()}-${sequence}`;
  }

  /**
   * Generate unique response number
   */
  private static async generateResponseNumber(rfqId: string): Promise<string> {
    const count = await sql`
      SELECT COUNT(*) as count FROM rfq_responses 
      WHERE rfq_id = ${rfqId}`;
    
    const sequence = (parseInt(count[0].count) + 1).toString().padStart(3, '0');
    return `RSP-${rfqId.slice(0, 8).toUpperCase()}-${sequence}`;
  }

  /**
   * Get RFQ items
   */
  private static async getItems(rfqId: string): Promise<RFQItem[]> {
    try {
      const items = await sql`
        SELECT * FROM rfq_items 
        WHERE rfq_id = ${rfqId}
        ORDER BY line_number`;
      
      return items.map(item => ({
        id: item.id,
        lineNumber: item.line_number,
        itemCode: item.item_code,
        description: item.description,
        specifications: item.specifications,
        quantity: item.quantity,
        unit: item.uom,
        category: item.category,
        estimatedUnitPrice: item.estimated_unit_price,
        estimatedTotalPrice: item.estimated_total_price
      }));
    } catch (error) {
      log.error('Error fetching RFQ items:', { data: error }, 'neonRfqService');
      return [];
    }
  }

  /**
   * Add RFQ items
   */
  private static async addItems(rfqId: string, items: any[]): Promise<void> {
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await sql`
          INSERT INTO rfq_items (
            rfq_id, line_number, item_code, description,
            specifications, quantity, uom, category,
            estimated_unit_price, estimated_total_price
          ) VALUES (
            ${rfqId},
            ${i + 1},
            ${item.itemCode || ''},
            ${item.description},
            ${item.specifications || ''},
            ${item.quantity},
            ${item.unit || 'EA'},
            ${item.category || ''},
            ${item.estimatedUnitPrice || 0},
            ${item.estimatedTotalPrice || item.quantity * (item.estimatedUnitPrice || 0)}
          )`;
      }
    } catch (error) {
      log.error('Error adding RFQ items:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Get RFQ responses
   */
  private static async getResponses(rfqId: string): Promise<RFQResponse[]> {
    try {
      const responses = await sql`
        SELECT 
          r.*,
          s.company_name,
          s.email as supplier_email,
          s.phone as supplier_phone
        FROM rfq_responses r
        LEFT JOIN suppliers s ON r.supplier_id = s.id
        WHERE r.rfq_id = ${rfqId}
        ORDER BY r.submission_date DESC`;
      
      return responses.map(response => ({
        id: response.id,
        rfqId: response.rfq_id,
        supplierId: response.supplier_id,
        supplierName: response.supplier_name || response.company_name,
        supplierEmail: response.supplier_email,
        supplierPhone: response.supplier_phone,
        responseNumber: response.response_number,
        submissionDate: response.submission_date,
        totalAmount: response.total_amount,
        currency: response.currency,
        validityPeriod: response.validity_period,
        paymentTerms: response.payment_terms,
        deliveryTerms: response.delivery_terms,
        deliveryDate: response.delivery_date,
        deliveryDays: response.delivery_days,
        status: response.status,
        evaluationScore: response.evaluation_score,
        evaluationStatus: response.evaluation_status,
        evaluationNotes: response.evaluation_notes
      }));
    } catch (error) {
      log.error('Error fetching RFQ responses:', { data: error }, 'neonRfqService');
      return [];
    }
  }

  /**
   * Update RFQ status
   */
  private static async updateStatus(id: string, status: RFQStatus): Promise<void> {
    try {
      await sql`
        UPDATE rfqs 
        SET 
          status = ${status},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${id}`;
    } catch (error) {
      log.error('Error updating RFQ status:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Validate status transition
   */
  private static validateStatusTransition(currentStatus: RFQStatus, newStatus: RFQStatus): boolean {
    const validTransitions: Record<RFQStatus, RFQStatus[]> = {
      [RFQStatus.DRAFT]: [RFQStatus.READY_TO_SEND, RFQStatus.CANCELLED],
      [RFQStatus.READY_TO_SEND]: [RFQStatus.ISSUED, RFQStatus.CANCELLED],
      [RFQStatus.ISSUED]: [RFQStatus.RESPONSES_RECEIVED, RFQStatus.CLOSED, RFQStatus.CANCELLED],
      [RFQStatus.RESPONSES_RECEIVED]: [RFQStatus.EVALUATED, RFQStatus.AWARDED, RFQStatus.CLOSED, RFQStatus.CANCELLED],
      [RFQStatus.EVALUATED]: [RFQStatus.AWARDED, RFQStatus.CLOSED, RFQStatus.CANCELLED],
      [RFQStatus.AWARDED]: [RFQStatus.CLOSED],
      [RFQStatus.CLOSED]: [],
      [RFQStatus.CANCELLED]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Get notification message template
   */
  private static getNotificationMessage(type: string, rfq: any): string {
    const templates: Record<string, string> = {
      invitation: `You have been invited to submit a quote for RFQ ${rfq.rfqNumber}. The deadline is ${new Date(rfq.responseDeadline).toLocaleDateString()}.`,
      reminder: `This is a reminder that the deadline for RFQ ${rfq.rfqNumber} is approaching.`,
      deadline_extended: `The deadline for RFQ ${rfq.rfqNumber} has been extended.`,
      evaluation: `Your response for RFQ ${rfq.rfqNumber} is being evaluated.`,
      award: `RFQ ${rfq.rfqNumber} has been awarded.`,
      cancellation: `RFQ ${rfq.rfqNumber} has been cancelled.`
    };
    
    return templates[type] || `Update regarding RFQ ${rfq.rfqNumber}`;
  }

  // ============= QUERY OPERATIONS =============

  /**
   * Get all RFQs with filtering
   */
  static async getAll(filter?: { 
    projectId?: string; 
    status?: RFQStatus; 
    supplierId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rfqs: RFQ[], total: number }> {
    try {
      let conditions = [];
      let params: any[] = [];
      
      if (filter?.projectId) {
        conditions.push(`project_id = $${params.length + 1}`);
        params.push(filter.projectId);
      }
      if (filter?.status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(filter.status);
      }
      if (filter?.supplierId) {
        conditions.push(`invited_suppliers::jsonb @> $${params.length + 1}::jsonb`);
        params.push(JSON.stringify([filter.supplierId]));
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = filter?.limit || 100;
      const offset = ((filter?.page || 1) - 1) * limit;
      
      // Get total count
      const countResult = await sql(
        `SELECT COUNT(*) as total FROM rfqs ${whereClause}`,
        params
      );
      
      // Get paginated results
      params.push(limit);
      params.push(offset);
      
      const result = await sql(
        `SELECT 
          r.*,
          COUNT(DISTINCT ri.id) as item_count,
          COUNT(DISTINCT rr.id) as response_count
        FROM rfqs r
        LEFT JOIN rfq_items ri ON r.id = ri.rfq_id
        LEFT JOIN rfq_responses rr ON r.id = rr.rfq_id
        ${whereClause}
        GROUP BY r.id
        ORDER BY r.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      
      const rfqs = result.map(row => ({
        id: row.id,
        projectId: row.project_id,
        rfqNumber: row.rfq_number,
        title: row.title,
        description: row.description,
        status: row.status as RFQStatus,
        issueDate: row.issue_date,
        responseDeadline: row.response_deadline,
        closingDate: row.closing_date,
        invitedSuppliers: JSON.parse(row.invited_suppliers || '[]'),
        itemCount: parseInt(row.item_count) || 0,
        responseCount: parseInt(row.response_count) || 0,
        paymentTerms: row.payment_terms,
        deliveryTerms: row.delivery_terms,
        validityPeriod: row.validity_period || 30,
        currency: row.currency || 'ZAR',
        technicalRequirements: row.technical_requirements,
        totalBudgetEstimate: row.total_budget_estimate,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as RFQ));
      
      return {
        rfqs,
        total: parseInt(countResult[0].total)
      };
    } catch (error) {
      log.error('Error fetching RFQs:', { data: error }, 'neonRfqService');
      throw error;
    }
  }

  /**
   * Get RFQ statistics
   */
  static async getStatistics(projectId?: string): Promise<any> {
    try {
      let whereClause = '';
      let params: any[] = [];
      
      if (projectId) {
        whereClause = 'WHERE project_id = $1';
        params.push(projectId);
      }
      
      const stats = await sql(
        `SELECT 
          COUNT(*) as total_rfqs,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
          COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued_count,
          COUNT(CASE WHEN status = 'responses_received' THEN 1 END) as responses_received_count,
          COUNT(CASE WHEN status = 'evaluated' THEN 1 END) as evaluated_count,
          COUNT(CASE WHEN status = 'awarded' THEN 1 END) as awarded_count,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
          SUM(total_budget_estimate) as total_budget,
          AVG(total_budget_estimate) as average_budget
        FROM rfqs ${whereClause}`,
        params
      );
      
      return {
        totalRFQs: parseInt(stats[0].total_rfqs),
        byStatus: {
          draft: parseInt(stats[0].draft_count),
          issued: parseInt(stats[0].issued_count),
          responsesReceived: parseInt(stats[0].responses_received_count),
          evaluated: parseInt(stats[0].evaluated_count),
          awarded: parseInt(stats[0].awarded_count),
          closed: parseInt(stats[0].closed_count),
          cancelled: parseInt(stats[0].cancelled_count)
        },
        totalBudget: parseFloat(stats[0].total_budget || 0),
        averageBudget: parseFloat(stats[0].average_budget || 0)
      };
    } catch (error) {
      log.error('Error fetching RFQ statistics:', { data: error }, 'neonRfqService');
      throw error;
    }
  }
}

// Export for backward compatibility
export default NeonRFQService;