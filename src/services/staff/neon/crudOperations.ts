/**
 * Staff CRUD Operations
 * Core CRUD operations for staff management
 */

import { getSql } from '@/lib/neon-sql';
import { StaffMember, StaffFormData } from '@/types/staff.types';
import { validateStaffData, processReportsToField, logDebugInfo, logError } from './validators';
import { log } from '@/lib/logger';

/**
 * Split full name into first and last name
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

/**
 * Create new staff member
 */
export async function createStaff(data: Partial<StaffMember>): Promise<StaffMember> {
  try {
    const formData = data as unknown as StaffFormData;
    logDebugInfo('CREATE', formData, formData.reportsTo);

    // Validate required fields
    validateStaffData(formData);

    // Process reportsTo field
    const processedReportsTo = processReportsToField(formData.reportsTo);

    // Split name into first_name and last_name
    const { firstName, lastName } = splitName(formData.name || '');

    const result = await getSql()`
      INSERT INTO staff (
        employee_id, first_name, last_name, email, phone, alternate_phone,
        department, position, status, join_date, reports_to, contract_type,
        address, city, state, postal_code,
        created_at, updated_at
      ) VALUES (
        ${(formData.employeeId || '').trim()}, ${firstName}, ${lastName},
        ${(formData.email || '').trim()}, ${(formData.phone || '').trim()},
        ${formData.alternativePhone || null},
        ${formData.department}, ${formData.position}, ${formData.status || 'ACTIVE'},
        ${formData.startDate || new Date()}, ${processedReportsTo},
        ${formData.contractType || null},
        ${formData.address || null}, ${formData.city || null},
        ${formData.province || null}, ${formData.postalCode || null},
        NOW(), NOW()
      ) RETURNING *
    `;

    const rows = result as any[];
    return rows[0] as StaffMember;
  } catch (error) {
    logError('CREATE', error, data);
    throw error;
  }
}

/**
 * Create or update staff member by employee ID (upsert operation)
 */
export async function createOrUpdateStaff(data: Partial<StaffMember>): Promise<StaffMember> {
  try {
    const formData = data as unknown as StaffFormData;
    logDebugInfo('CREATE_OR_UPDATE', formData, formData.reportsTo);

    // Validate required fields
    validateStaffData(formData);

    // Process reportsTo field
    const processedReportsTo = processReportsToField(formData.reportsTo);

    // Split name into first_name and last_name
    const { firstName, lastName } = splitName(formData.name || '');

    // Check if staff member exists by employee_id
    const existing = await getSql()`
      SELECT id FROM staff WHERE employee_id = ${formData.employeeId}
    `;

    const existingRows = existing as any[];
    if (existingRows.length > 0) {
      // Update existing staff member - include all available fields
      const result = await getSql()`
        UPDATE staff SET
          first_name = ${firstName},
          last_name = ${lastName},
          email = ${formData.email},
          phone = ${formData.phone},
          alternate_phone = ${formData.alternativePhone || null},
          department = ${formData.department},
          position = ${formData.position},
          status = ${formData.status || 'ACTIVE'},
          reports_to = ${processedReportsTo},
          contract_type = ${formData.contractType || null},
          address = ${formData.address || null},
          city = ${formData.city || null},
          state = ${formData.province || null},
          postal_code = ${formData.postalCode || null},
          updated_at = NOW()
        WHERE employee_id = ${formData.employeeId}
        RETURNING *
      `;

      const rows = result as any[];
      return rows[0] as StaffMember;
    } else {
      // Create new staff member - include all available fields
      const result = await getSql()`
        INSERT INTO staff (
          employee_id, first_name, last_name, email, phone, alternate_phone,
          department, position, status, join_date, reports_to, contract_type,
          address, city, state, postal_code,
          created_at, updated_at
        ) VALUES (
          ${formData.employeeId}, ${firstName}, ${lastName},
          ${formData.email}, ${formData.phone}, ${formData.alternativePhone || null},
          ${formData.department}, ${formData.position}, ${formData.status || 'ACTIVE'},
          ${formData.startDate || new Date()}, ${processedReportsTo},
          ${formData.contractType || null},
          ${formData.address || null}, ${formData.city || null},
          ${formData.province || null}, ${formData.postalCode || null},
          NOW(), NOW()
        ) RETURNING *
      `;

      const rows = result as any[];
      return rows[0] as StaffMember;
    }
  } catch (error) {
    logError('CREATE_OR_UPDATE', error, data);
    throw error;
  }
}

/**
 * Update staff member
 */
export async function updateStaff(id: string, data: Partial<StaffMember>): Promise<StaffMember> {
  try {
    // Handle empty string for UUID fields - convert to null
    const reportsTo = data.reportsTo && data.reportsTo.trim() !== '' ? data.reportsTo : null;

    // Split name if provided as full name
    const formData = data as unknown as StaffFormData;
    let firstName = data.firstName;
    let lastName = data.lastName;
    if (formData.name && !firstName) {
      const nameParts = splitName(formData.name);
      firstName = nameParts.firstName;
      lastName = nameParts.lastName;
    }

    // Handle contract_type
    const contractType = (data as any).contractType || (data as any).contract_type || null;

    const result = await getSql()`
      UPDATE staff SET
        first_name = COALESCE(${firstName}, first_name),
        last_name = COALESCE(${lastName}, last_name),
        email = COALESCE(${data.email}, email),
        phone = COALESCE(${data.phone}, phone),
        alternate_phone = COALESCE(${formData.alternativePhone}, alternate_phone),
        department = COALESCE(${data.department}, department),
        position = COALESCE(${data.position}, position),
        status = COALESCE(${data.status}, status),
        reports_to = ${reportsTo},
        contract_type = COALESCE(${contractType}, contract_type),
        address = COALESCE(${formData.address}, address),
        city = COALESCE(${formData.city}, city),
        state = COALESCE(${formData.province}, state),
        postal_code = COALESCE(${formData.postalCode}, postal_code),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    const rows = result as any[];
    return rows[0] as StaffMember;
  } catch (error) {
    log.error('Error updating staff member:', { data: error }, 'crudOperations');
    throw error;
  }
}

/**
 * Delete staff member
 */
export async function deleteStaff(id: string): Promise<void> {
  try {
    await getSql()`DELETE FROM staff WHERE id = ${id}`;
  } catch (error) {
    log.error('Error deleting staff member:', { data: error }, 'crudOperations');
    throw error;
  }
}