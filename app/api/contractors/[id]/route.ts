/**
 * Contractors API Route - Single Contractor Operations
 * GET    /api/contractors/[id] - Get contractor by ID
 * PUT    /api/contractors/[id] - Update contractor
 * DELETE /api/contractors/[id] - Delete contractor
 */

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import type { Contractor, ContractorFormData } from '@/types/contractor.core.types';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL || '');

// ==================== GET /api/contractors/[id] ====================

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [contractor] = await sql`
      SELECT * FROM contractors
      WHERE id = ${params.id}
    `;

    if (!contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    const mapped = mapDbToContractor(contractor);

    return NextResponse.json({ data: mapped });
  } catch (error) {
    console.error('Error fetching contractor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contractor' },
      { status: 500 }
    );
  }
}

// ==================== PUT /api/contractors/[id] ====================

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: Partial<ContractorFormData> = await req.json();

    // Check if contractor exists
    const [existing] = await sql`
      SELECT id FROM contractors WHERE id = ${params.id}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically based on provided fields
    const [updated] = await sql`
      UPDATE contractors
      SET
        company_name = COALESCE(${body.companyName}, company_name),
        registration_number = COALESCE(${body.registrationNumber}, registration_number),
        business_type = COALESCE(${body.businessType}, business_type),
        industry_category = COALESCE(${body.industryCategory}, industry_category),
        years_in_business = COALESCE(${body.yearsInBusiness}, years_in_business),
        contact_person = COALESCE(${body.contactPerson}, contact_person),
        email = COALESCE(${body.email}, email),
        phone = COALESCE(${body.phone}, phone),
        alternate_phone = COALESCE(${body.alternatePhone}, alternate_phone),
        physical_address = COALESCE(${body.physicalAddress}, physical_address),
        city = COALESCE(${body.city}, city),
        province = COALESCE(${body.province}, province),
        postal_code = COALESCE(${body.postalCode}, postal_code),
        bank_name = COALESCE(${body.bankName}, bank_name),
        account_number = COALESCE(${body.accountNumber}, account_number),
        branch_code = COALESCE(${body.branchCode}, branch_code),
        status = COALESCE(${body.status}, status),
        is_active = COALESCE(${body.isActive !== undefined ? body.isActive : null}, is_active),
        compliance_status = COALESCE(${body.complianceStatus}, compliance_status),
        specializations = COALESCE(${body.specializations}, specializations),
        certifications = COALESCE(${body.certifications}, certifications),
        notes = COALESCE(${body.notes}, notes),
        tags = COALESCE(${body.tags}, tags),
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `;

    const mapped = mapDbToContractor(updated);

    return NextResponse.json({ data: mapped });
  } catch (error: any) {
    console.error('Error updating contractor:', error);

    // Handle unique constraint violations
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Contractor with this registration number or email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update contractor' },
      { status: 500 }
    );
  }
}

// ==================== DELETE /api/contractors/[id] ====================

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if contractor exists
    const [existing] = await sql`
      SELECT id FROM contractors WHERE id = ${params.id}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Delete contractor
    await sql`
      DELETE FROM contractors
      WHERE id = ${params.id}
    `;

    return NextResponse.json({
      success: true,
      message: 'Contractor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contractor:', error);
    return NextResponse.json(
      { error: 'Failed to delete contractor' },
      { status: 500 }
    );
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Map database row (snake_case) to Contractor interface (camelCase)
 */
function mapDbToContractor(row: any): Contractor {
  return {
    id: row.id,

    // Company
    companyName: row.company_name,
    registrationNumber: row.registration_number,
    businessType: row.business_type,
    industryCategory: row.industry_category || '',
    yearsInBusiness: row.years_in_business,

    // Contact
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    alternatePhone: row.alternate_phone,

    // Address
    physicalAddress: row.physical_address,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,

    // Financial
    bankName: row.bank_name,
    accountNumber: row.account_number,
    branchCode: row.branch_code,

    // Status
    status: row.status,
    isActive: row.is_active,
    complianceStatus: row.compliance_status,

    // Professional
    specializations: row.specializations || [],
    certifications: row.certifications || [],

    // Metadata
    notes: row.notes,
    tags: row.tags || [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
