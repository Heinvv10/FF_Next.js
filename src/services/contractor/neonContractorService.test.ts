/**
 * Tests for neonContractorService
 * Tests all CRUD operations, filtering, and data mapping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContractorFormData, TeamFormData } from '@/types/contractor.types';

// Use vi.hoisted() to create mock that's available during hoisting
const { mockSql } = vi.hoisted(() => {
  return {
    mockSql: vi.fn()
  };
});

// Mock dependencies BEFORE importing the service
vi.mock('@neondatabase/serverless', () => ({
  neon: () => mockSql
}));

vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

// NOW import the service after mocks are set up
import { neonContractorService } from './neonContractorService';

describe('neonContractorService', () => {
  beforeEach(() => {
    // Clear mock state before each test
    vi.clearAllMocks();
  });

  describe('getContractors', () => {
    const mockContractorRow = {
      id: 'contractor-123',
      company_name: 'Test Contractor Inc',
      contact_person: 'John Doe',
      email: 'john@test.com',
      phone: '1234567890',
      physical_address: '123 Main St',
      postal_address: 'PO Box 123',
      city: 'Cape Town',
      province: 'Western Cape',
      postal_code: '8001',
      annual_turnover: 1000000,
      credit_rating: 'A',
      payment_terms: '30 days',
      bank_name: 'Test Bank',
      account_number: '123456789',
      branch_code: '123456',
      status: 'approved',
      is_active: true,
      compliance_status: 'compliant',
      rag_overall: 'green',
      rag_financial: 'green',
      rag_compliance: 'green',
      rag_performance: 'green',
      rag_safety: 'green',
      performance_score: 90,
      safety_score: 95,
      quality_score: 88,
      timeliness_score: 92,
      specializations: ['Fiber Installation', 'Pole Erection'],
      total_projects: 10,
      completed_projects: 8,
      active_projects: 2,
      cancelled_projects: 0,
      success_rate: 80,
      on_time_completion: 85,
      average_project_value: 100000,
      certifications: ['PSIRA', 'OHS'],
      onboarding_progress: 100,
      onboarding_completed_at: new Date('2024-01-15'),
      documents_expiring: 0,
      notes: 'Test notes',
      tags: ['reliable', 'quality'],
      last_activity: new Date(),
      next_review_date: new Date('2025-01-01'),
      created_by: 'admin',
      updated_by: 'admin',
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    };

    it('should get all contractors with no filters', async () => {
      mockSql.mockResolvedValue([mockContractorRow]);

      const result = await neonContractorService.getContractors();

      expect(result).toHaveLength(1);
      expect(result[0].companyName).toBe('Test Contractor Inc');
      expect(result[0].email).toBe('john@test.com');
    });

    it('should filter contractors by search term', async () => {
      mockSql.mockResolvedValue([mockContractorRow]);

      const result = await neonContractorService.getContractors({
        search: 'Test Contractor'
      });

      expect(result).toHaveLength(1);
      expect(mockSql).toHaveBeenCalled();
    });

    it('should filter contractors by status (single)', async () => {
      mockSql.mockResolvedValue([mockContractorRow]);

      const result = await neonContractorService.getContractors({
        status: 'approved'
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('approved');
    });

    it('should filter contractors by status (multiple)', async () => {
      mockSql.mockResolvedValue([mockContractorRow]);

      const result = await neonContractorService.getContractors({
        status: ['approved', 'active']
      });

      expect(result).toHaveLength(1);
    });

    it('should filter contractors by isActive', async () => {
      mockSql.mockResolvedValue([mockContractorRow]);

      const result = await neonContractorService.getContractors({
        status: 'approved',
        isActive: true
      });

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should handle database errors', async () => {
      mockSql.mockRejectedValue(new Error('Database error'));

      await expect(neonContractorService.getContractors()).rejects.toThrow('Database error');
    });

    it('should return empty array when no contractors found', async () => {
      mockSql.mockResolvedValue([]);

      const result = await neonContractorService.getContractors();

      expect(result).toHaveLength(0);
    });
  });

  describe('getContractorById', () => {
    const mockContractorRow = {
      id: 'contractor-123',
      company_name: 'Test Contractor Inc',
      contact_person: 'John Doe',
      email: 'john@test.com',
      phone: '1234567890',
      physical_address: '123 Main St',
      postal_address: 'PO Box 123',
      city: 'Cape Town',
      province: 'Western Cape',
      postal_code: '8001',
      status: 'approved',
      is_active: true,
      compliance_status: 'compliant',
      rag_overall: 'green',
      specializations: [],
      certifications: [],
      tags: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should get contractor by ID', async () => {
      mockSql.mockResolvedValue([mockContractorRow]);

      const result = await neonContractorService.getContractorById('contractor-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('contractor-123');
      expect(result?.companyName).toBe('Test Contractor Inc');
    });

    it('should return null when contractor not found', async () => {
      mockSql.mockResolvedValue([]);

      const result = await neonContractorService.getContractorById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockSql.mockRejectedValue(new Error('Database error'));

      await expect(neonContractorService.getContractorById('contractor-123')).rejects.toThrow();
    });
  });

  describe('createContractor', () => {
    const mockFormData: ContractorFormData = {
      companyName: 'New Contractor Ltd',
      contactPerson: 'Jane Smith',
      email: 'jane@newcontractor.com',
      phone: '0987654321',
      physicalAddress: '456 Oak Ave',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2000',
      status: 'pending'
    };

    const mockCreatedRow = {
      id: 'contractor-456',
      company_name: 'New Contractor Ltd',
      contact_person: 'Jane Smith',
      email: 'jane@newcontractor.com',
      phone: '0987654321',
      physical_address: '456 Oak Ave',
      city: 'Johannesburg',
      province: 'Gauteng',
      postal_code: '2000',
      status: 'pending',
      is_active: true,
      specializations: [],
      certifications: [],
      tags: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should create new contractor', async () => {
      mockSql.mockResolvedValue([mockCreatedRow]);

      const result = await neonContractorService.createContractor(mockFormData);

      expect(result).toBeDefined();
      expect(result.companyName).toBe('New Contractor Ltd');
      expect(result.email).toBe('jane@newcontractor.com');
      expect(mockSql).toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      mockSql.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(neonContractorService.createContractor(mockFormData)).rejects.toThrow();
    });
  });

  describe('updateContractor', () => {
    const mockUpdatedRow = {
      id: 'contractor-123',
      company_name: 'Updated Contractor Inc',
      contact_person: 'John Doe',
      email: 'john.updated@test.com',
      phone: '1234567890',
      status: 'approved',
      is_active: true,
      specializations: [],
      certifications: [],
      tags: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should update contractor', async () => {
      mockSql.mockResolvedValue([mockUpdatedRow]);

      const result = await neonContractorService.updateContractor('contractor-123', {
        companyName: 'Updated Contractor Inc',
        email: 'john.updated@test.com'
      });

      expect(result).toBeDefined();
      expect(result.companyName).toBe('Updated Contractor Inc');
      expect(result.email).toBe('john.updated@test.com');
    });

    it('should handle partial updates', async () => {
      mockSql.mockResolvedValue([mockUpdatedRow]);

      const result = await neonContractorService.updateContractor('contractor-123', {
        status: 'approved'
      });

      expect(result.status).toBe('approved');
    });

    it('should handle database errors during update', async () => {
      mockSql.mockRejectedValue(new Error('Database error'));

      await expect(
        neonContractorService.updateContractor('contractor-123', { companyName: 'Updated' })
      ).rejects.toThrow();
    });
  });

  describe('deleteContractor', () => {
    it('should soft delete contractor', async () => {
      mockSql.mockResolvedValue([]);

      await expect(neonContractorService.deleteContractor('contractor-123')).resolves.not.toThrow();
      expect(mockSql).toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      mockSql.mockRejectedValue(new Error('Database error'));

      await expect(neonContractorService.deleteContractor('contractor-123')).rejects.toThrow();
    });
  });

  describe('Team Operations', () => {
    const mockTeamRow = {
      id: 'team-123',
      contractor_id: 'contractor-123',
      team_name: 'Installation Team A',
      team_type: 'installation',
      team_size: 5,
      lead_name: 'Bob Johnson',
      lead_phone: '1112223333',
      lead_email: 'bob@test.com',
      lead_certification: 'PSIRA',
      members: [],
      specializations: ['Fiber', 'Trenching'],
      equipment_available: [],
      service_areas: [],
      availability: 'available',
      current_workload: 2,
      max_capacity: 5,
      team_rating: 4.5,
      projects_completed: 20,
      average_completion_time: 15,
      is_active: true,
      last_assignment_date: new Date(),
      notes: 'Excellent team',
      created_by: 'admin',
      updated_by: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    };

    describe('getContractorTeams', () => {
      it('should get teams for contractor', async () => {
        mockSql.mockResolvedValue([mockTeamRow]);

        const result = await neonContractorService.getContractorTeams('contractor-123');

        expect(result).toHaveLength(1);
        expect(result[0].teamName).toBe('Installation Team A');
        expect(result[0].contractorId).toBe('contractor-123');
      });

      it('should return empty array when no teams found', async () => {
        mockSql.mockResolvedValue([]);

        const result = await neonContractorService.getContractorTeams('contractor-123');

        expect(result).toHaveLength(0);
      });

      it('should handle database errors', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(neonContractorService.getContractorTeams('contractor-123')).rejects.toThrow();
      });
    });

    describe('createTeam', () => {
      const mockTeamData: TeamFormData = {
        teamName: 'New Team B',
        teamType: 'maintenance',
        teamSize: 3,
        leadName: 'Alice Brown',
        leadPhone: '4445556666',
        availability: 'available'
      };

      it('should create new team', async () => {
        mockSql.mockResolvedValue([{ ...mockTeamRow, ...mockTeamData }]);

        const result = await neonContractorService.createTeam('contractor-123', mockTeamData);

        expect(result).toBeDefined();
        expect(result.teamName).toBe('New Team B');
      });

      it('should handle database errors during team creation', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.createTeam('contractor-123', mockTeamData)
        ).rejects.toThrow();
      });
    });

    describe('updateTeam', () => {
      it('should update team', async () => {
        const updatedTeam = { ...mockTeamRow, team_name: 'Updated Team A' };
        mockSql.mockResolvedValue([updatedTeam]);

        const result = await neonContractorService.updateTeam('team-123', {
          teamName: 'Updated Team A'
        });

        expect(result.teamName).toBe('Updated Team A');
      });

      it('should handle partial team updates', async () => {
        mockSql.mockResolvedValue([{ ...mockTeamRow, availability: 'busy' }]);

        const result = await neonContractorService.updateTeam('team-123', {
          availability: 'busy'
        });

        expect(result.availability).toBe('busy');
      });

      it('should handle database errors during team update', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.updateTeam('team-123', { teamName: 'Updated' })
        ).rejects.toThrow();
      });
    });

    describe('deleteTeam', () => {
      it('should delete team', async () => {
        mockSql.mockResolvedValue([]);

        await expect(neonContractorService.deleteTeam('team-123')).resolves.not.toThrow();
        expect(mockSql).toHaveBeenCalled();
      });

      it('should handle database errors during team deletion', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(neonContractorService.deleteTeam('team-123')).rejects.toThrow();
      });
    });
  });

  describe('Document Operations', () => {
    const mockDocumentRow = {
      id: 'doc-123',
      contractor_id: 'contractor-123',
      document_type: 'Company Registration',
      document_name: 'CK Document',
      document_number: 'CK2024/001',
      file_name: 'ck_registration.pdf',
      file_path: '/uploads/ck_registration.pdf',
      file_url: 'https://example.com/ck_registration.pdf',
      file_size: 1024000,
      mime_type: 'application/pdf',
      issue_date: new Date('2024-01-01'),
      expiry_date: new Date('2025-01-01'),
      is_expired: false,
      days_until_expiry: 100,
      is_verified: true,
      verified_by: 'admin',
      verified_at: new Date(),
      verification_notes: 'Document verified',
      status: 'approved',
      rejection_reason: null,
      notes: 'Valid document',
      tags: ['important'],
      uploaded_by: 'user-123',
      created_at: new Date(),
      updated_at: new Date()
    };

    describe('getContractorDocuments', () => {
      it('should get documents for contractor', async () => {
        mockSql.mockResolvedValue([mockDocumentRow]);

        const result = await neonContractorService.getContractorDocuments('contractor-123');

        expect(result).toHaveLength(1);
        expect(result[0].documentType).toBe('Company Registration');
        expect(result[0].contractorId).toBe('contractor-123');
      });

      it('should return empty array when no documents found', async () => {
        mockSql.mockResolvedValue([]);

        const result = await neonContractorService.getContractorDocuments('contractor-123');

        expect(result).toHaveLength(0);
      });

      it('should handle database errors', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.getContractorDocuments('contractor-123')
        ).rejects.toThrow();
      });
    });

    describe('addDocument', () => {
      const mockDocData = {
        documentType: 'Tax Clearance',
        documentName: 'Tax Cert 2024',
        fileName: 'tax_cert.pdf',
        filePath: '/uploads/tax_cert.pdf',
        fileSize: 512000,
        mimeType: 'application/pdf',
        uploadedBy: 'user-123'
      };

      it('should add document to contractor', async () => {
        mockSql.mockResolvedValue([{ ...mockDocumentRow, ...mockDocData }]);

        const result = await neonContractorService.addDocument('contractor-123', mockDocData);

        expect(result).toBeDefined();
        expect(result.documentType).toBe('Tax Clearance');
      });

      it('should handle database errors during document creation', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.addDocument('contractor-123', mockDocData)
        ).rejects.toThrow();
      });
    });

    describe('updateDocument', () => {
      it('should update document', async () => {
        const updatedDoc = { ...mockDocumentRow, document_name: 'Updated Document' };
        mockSql.mockResolvedValue([updatedDoc]);

        const result = await neonContractorService.updateDocument('doc-123', {
          documentName: 'Updated Document'
        });

        expect(result.documentName).toBe('Updated Document');
      });

      it('should handle database errors during document update', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.updateDocument('doc-123', { documentName: 'Updated' })
        ).rejects.toThrow();
      });
    });

    describe('updateDocumentStatus', () => {
      it('should update document status to approved', async () => {
        const updatedDoc = { ...mockDocumentRow, status: 'approved' };
        mockSql.mockResolvedValue([updatedDoc]);

        const result = await neonContractorService.updateDocumentStatus('doc-123', 'approved');

        expect(result.status).toBe('approved');
      });

      it('should update document status to rejected with reason', async () => {
        const updatedDoc = { ...mockDocumentRow, status: 'rejected', rejection_reason: 'Expired' };
        mockSql.mockResolvedValue([updatedDoc]);

        const result = await neonContractorService.updateDocumentStatus(
          'doc-123',
          'rejected',
          'Expired'
        );

        expect(result.status).toBe('rejected');
      });

      it('should handle database errors during status update', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.updateDocumentStatus('doc-123', 'approved')
        ).rejects.toThrow();
      });
    });

    describe('verifyDocument', () => {
      it('should verify document', async () => {
        const verifiedDoc = { ...mockDocumentRow, is_verified: true, verified_by: 'admin-456' };
        mockSql.mockResolvedValue([verifiedDoc]);

        const result = await neonContractorService.verifyDocument(
          'doc-123',
          'admin-456',
          'Verified successfully'
        );

        expect(result.isVerified).toBe(true);
        expect(result.verifiedBy).toBe('admin-456');
      });

      it('should handle database errors during verification', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.verifyDocument('doc-123', 'admin-456')
        ).rejects.toThrow();
      });
    });

    describe('deleteDocument', () => {
      it('should delete document', async () => {
        mockSql.mockResolvedValue([]);

        await expect(neonContractorService.deleteDocument('doc-123')).resolves.not.toThrow();
        expect(mockSql).toHaveBeenCalled();
      });

      it('should handle database errors during document deletion', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(neonContractorService.deleteDocument('doc-123')).rejects.toThrow();
      });
    });
  });

  describe('RAG Score Operations', () => {
    const mockContractorRow = {
      id: 'contractor-123',
      company_name: 'Test Contractor',
      rag_overall: 'green',
      rag_financial: 'green',
      rag_compliance: 'amber',
      rag_performance: 'green',
      rag_safety: 'green',
      is_active: true,
      specializations: [],
      certifications: [],
      tags: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    describe('updateRAGScores', () => {
      it('should update RAG scores', async () => {
        mockSql.mockResolvedValue([{ ...mockContractorRow, rag_overall: 'amber' }]);

        const result = await neonContractorService.updateRAGScores('contractor-123', {
          ragOverall: 'amber',
          ragFinancial: 'green'
        });

        expect(result.ragOverall).toBe('amber');
      });

      it('should handle database errors during RAG score update', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.updateRAGScores('contractor-123', { ragOverall: 'red' })
        ).rejects.toThrow();
      });
    });

    describe('recordRAGHistory', () => {
      it('should record RAG history entry', async () => {
        mockSql.mockResolvedValue([]);

        await expect(
          neonContractorService.recordRAGHistory(
            'contractor-123',
            'overall',
            'green',
            'amber',
            'Performance declined',
            'admin-123'
          )
        ).resolves.not.toThrow();

        expect(mockSql).toHaveBeenCalled();
      });

      it('should handle database errors during history recording', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.recordRAGHistory(
            'contractor-123',
            'overall',
            'green',
            'red',
            'Critical issue',
            'admin-123'
          )
        ).rejects.toThrow();
      });
    });

    describe('getRAGHistory', () => {
      const mockHistoryRow = {
        id: 'history-123',
        contractor_id: 'contractor-123',
        score_type: 'overall',
        old_score: 'green',
        new_score: 'amber',
        change_reason: 'Performance declined',
        changed_by: 'admin-123',
        changed_at: new Date()
      };

      it('should get RAG history for contractor', async () => {
        mockSql.mockResolvedValue([mockHistoryRow]);

        const result = await neonContractorService.getRAGHistory('contractor-123');

        expect(result).toHaveLength(1);
        expect(result[0].score_type).toBe('overall');
      });

      it('should filter RAG history by score type', async () => {
        mockSql.mockResolvedValue([mockHistoryRow]);

        const result = await neonContractorService.getRAGHistory('contractor-123', 'overall');

        expect(result).toHaveLength(1);
        expect(result[0].score_type).toBe('overall');
      });

      it('should return empty array when no history found', async () => {
        mockSql.mockResolvedValue([]);

        const result = await neonContractorService.getRAGHistory('contractor-123');

        expect(result).toHaveLength(0);
      });

      it('should handle database errors', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(neonContractorService.getRAGHistory('contractor-123')).rejects.toThrow();
      });
    });
  });

  describe('Onboarding Operations', () => {
    const mockStageRow = {
      id: 'stage-123',
      contractor_id: 'contractor-123',
      stage_name: 'Document Submission',
      stage_order: 1,
      status: 'in_progress',
      completion_percentage: 50,
      required_documents: ['CK Document', 'Tax Clearance'],
      completed_documents: ['CK Document'],
      started_at: new Date(),
      completed_at: null,
      due_date: new Date('2025-02-01'),
      notes: 'Waiting for tax clearance',
      created_at: new Date(),
      updated_at: new Date()
    };

    describe('getOnboardingStages', () => {
      it('should get onboarding stages for contractor', async () => {
        mockSql.mockResolvedValue([mockStageRow]);

        const result = await neonContractorService.getOnboardingStages('contractor-123');

        expect(result).toHaveLength(1);
        expect(result[0].stageName).toBe('Document Submission');
        expect(result[0].status).toBe('in_progress');
      });

      it('should return empty array when no stages found', async () => {
        mockSql.mockResolvedValue([]);

        const result = await neonContractorService.getOnboardingStages('contractor-123');

        expect(result).toHaveLength(0);
      });

      it('should handle database errors', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.getOnboardingStages('contractor-123')
        ).rejects.toThrow();
      });
    });

    describe('updateOnboardingStage', () => {
      it('should update onboarding stage', async () => {
        const updatedStage = { ...mockStageRow, status: 'completed', completion_percentage: 100 };
        mockSql.mockResolvedValue([updatedStage]);

        const result = await neonContractorService.updateOnboardingStage('stage-123', {
          status: 'completed',
          completionPercentage: 100
        });

        expect(result.status).toBe('completed');
        expect(result.completionPercentage).toBe(100);
      });

      it('should handle database errors during stage update', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(
          neonContractorService.updateOnboardingStage('stage-123', { status: 'completed' })
        ).rejects.toThrow();
      });
    });

    describe('completeOnboarding', () => {
      const mockContractorRow = {
        id: 'contractor-123',
        company_name: 'Test Contractor',
        onboarding_progress: 100,
        onboarding_completed_at: new Date(),
        is_active: true,
        specializations: [],
        certifications: [],
        tags: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      it('should complete onboarding for contractor', async () => {
        // Mock stages query to return completed stages
        mockSql
          .mockResolvedValueOnce([
            { ...mockStageRow, status: 'completed' },
            { ...mockStageRow, id: 'stage-124', status: 'completed' }
          ])
          .mockResolvedValueOnce([mockContractorRow]);

        const result = await neonContractorService.completeOnboarding('contractor-123');

        expect(result.onboardingProgress).toBe(100);
        expect(result.onboardingCompletedAt).toBeDefined();
      });

      it('should throw error if required stages not completed', async () => {
        // Mock stages query to return incomplete stages
        mockSql.mockResolvedValue([
          { ...mockStageRow, status: 'in_progress' },
          { ...mockStageRow, id: 'stage-124', status: 'pending' }
        ]);

        await expect(neonContractorService.completeOnboarding('contractor-123')).rejects.toThrow();
      });

      it('should handle database errors during onboarding completion', async () => {
        mockSql.mockRejectedValue(new Error('Database error'));

        await expect(neonContractorService.completeOnboarding('contractor-123')).rejects.toThrow();
      });
    });
  });

  describe('Mapper Methods', () => {
    describe('mapContractor', () => {
      it('should map database row to Contractor type', () => {
        const row = {
          id: 'contractor-123',
          company_name: 'Test Company',
          contact_person: 'John Doe',
          email: 'john@test.com',
          phone: '1234567890',
          status: 'approved',
          is_active: true,
          specializations: ['Fiber'],
          certifications: ['PSIRA'],
          tags: ['reliable'],
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = neonContractorService.mapContractor(row);

        expect(result.id).toBe('contractor-123');
        expect(result.companyName).toBe('Test Company');
        expect(result.contactPerson).toBe('John Doe');
        expect(result.email).toBe('john@test.com');
      });
    });

    describe('mapContractors', () => {
      it('should map array of database rows', () => {
        const rows = [
          {
            id: 'contractor-1',
            company_name: 'Company 1',
            is_active: true,
            specializations: [],
            certifications: [],
            tags: [],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 'contractor-2',
            company_name: 'Company 2',
            is_active: true,
            specializations: [],
            certifications: [],
            tags: [],
            created_at: new Date(),
            updated_at: new Date()
          }
        ];

        const result = neonContractorService.mapContractors(rows);

        expect(result).toHaveLength(2);
        expect(result[0].companyName).toBe('Company 1');
        expect(result[1].companyName).toBe('Company 2');
      });
    });

    describe('mapTeam', () => {
      it('should map database row to ContractorTeam type', () => {
        const row = {
          id: 'team-123',
          contractor_id: 'contractor-123',
          team_name: 'Team A',
          team_type: 'installation',
          team_size: 5,
          is_active: true,
          members: [],
          specializations: [],
          equipment_available: [],
          service_areas: [],
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = neonContractorService.mapTeam(row);

        expect(result.id).toBe('team-123');
        expect(result.teamName).toBe('Team A');
        expect(result.teamType).toBe('installation');
      });
    });

    describe('mapDocument', () => {
      it('should map database row to ContractorDocument type', () => {
        const row = {
          id: 'doc-123',
          contractor_id: 'contractor-123',
          document_type: 'CK',
          document_name: 'Company Registration',
          file_name: 'ck.pdf',
          file_path: '/uploads/ck.pdf',
          status: 'approved',
          is_verified: true,
          tags: [],
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = neonContractorService.mapDocument(row);

        expect(result.id).toBe('doc-123');
        expect(result.documentType).toBe('CK');
        expect(result.documentName).toBe('Company Registration');
      });
    });

    describe('mapOnboardingStage', () => {
      it('should map database row to OnboardingStage type', () => {
        const row = {
          id: 'stage-123',
          contractor_id: 'contractor-123',
          stage_name: 'Document Submission',
          stage_order: 1,
          status: 'in_progress',
          completion_percentage: 50,
          required_documents: ['CK'],
          completed_documents: [],
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = neonContractorService.mapOnboardingStage(row);

        expect(result.id).toBe('stage-123');
        expect(result.stageName).toBe('Document Submission');
        expect(result.status).toBe('in_progress');
      });
    });
  });
});
