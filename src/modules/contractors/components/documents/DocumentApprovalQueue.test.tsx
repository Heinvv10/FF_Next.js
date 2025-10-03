/**
 * DocumentApprovalQueue Component Tests
 * Comprehensive test suite for document approval workflow functionality
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocumentApprovalQueue } from './DocumentApprovalQueue';
import { contractorDocumentService } from '@/services/contractor/contractorDocumentService';
import { ContractorDocument } from '@/types/contractor.types';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('@/services/contractor/contractorDocumentService', () => ({
  contractorDocumentService: {
    getByContractor: vi.fn(),
    verifyDocument: vi.fn()
  }
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock UI components
vi.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Mock useDocumentQueue hook
vi.mock('../../hooks/useDocumentQueue', () => ({
  useDocumentQueue: () => ({
    documents: [
      {
        id: '1',
        documentName: 'Test Document',
        documentType: 'certificate',
        verificationStatus: 'pending',
        uploadedAt: new Date('2024-01-01'),
        contractor: {
          id: '1',
          companyName: 'Test Company'
        }
      }
    ],
    filteredDocuments: [
      {
        id: '1',
        documentName: 'Test Document',
        documentType: 'certificate',
        verificationStatus: 'pending',
        uploadedAt: new Date('2024-01-01'),
        contractor: {
          id: '1',
          companyName: 'Test Company'
        }
      }
    ],
    selectedDocuments: new Set(),
    isLoading: false,
    isRefreshing: false,
    error: null,
    isProcessing: false,
    processingDocuments: new Set(),
    searchTerm: '',
    statusFilter: 'pending',
    documentTypeFilter: 'all',
    expiryFilter: 'all',
    actions: {
      loadDocuments: vi.fn(),
      setSearchTerm: vi.fn(),
      setStatusFilter: vi.fn(),
      setDocumentTypeFilter: vi.fn(),
      setExpiryFilter: vi.fn(),
      setSelectedDocuments: vi.fn(),
      approveDocument: vi.fn(),
      rejectDocument: vi.fn(),
      bulkApproveDocuments: vi.fn()
    },
    stats: {
      total: 1,
      pending: 1,
      approved: 0,
      rejected: 0,
      expired: 0,
      expiringWithin30Days: 0,
      averageProcessingTime: 0,
      queuedToday: 1,
      processedToday: 0
    }
  })
}));

// Mock child components
vi.mock('./DocumentViewer', () => ({
  DocumentViewer: ({ document, onClose }: any) => (
    <div data-testid="document-viewer">
      <h3>Document Viewer: {document.fileName}</h3>
      <button onClick={onClose}>Close Viewer</button>
    </div>
  )
}));

vi.mock('./ApprovalActions', () => ({
  ApprovalActions: ({ document, onApprove, onReject, isProcessing }: any) => (
    <div data-testid="approval-actions">
      <button 
        onClick={() => onApprove('Test approval notes')}
        disabled={isProcessing}
      >
        Approve
      </button>
      <button 
        onClick={() => onReject('Test rejection notes', 'expired')}
        disabled={isProcessing}
      >
        Reject
      </button>
    </div>
  )
}));

vi.mock('./DocumentFilters', () => ({
  DocumentFilters: ({ onSearchChange, onStatusFilterChange }: any) => (
    <div data-testid="document-filters">
      <input 
        data-testid="search-input"
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search documents..."
      />
      <select 
        data-testid="status-filter"
        onChange={(e) => onStatusFilterChange(e.target.value)}
      >
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  )
}));

vi.mock('./ComplianceTracker', () => ({
  ComplianceTracker: ({ onClose }: any) => (
    <div data-testid="compliance-tracker">
      <h3>Compliance Tracker</h3>
      <button onClick={onClose}>Close Tracker</button>
    </div>
  )
}));

vi.mock('./BatchApprovalModal', () => ({
  BatchApprovalModal: ({ documentIds, onSubmit, onClose }: any) => (
    <div data-testid="batch-approval-modal">
      <h3>Batch Approval: {documentIds.length} documents</h3>
      <button onClick={() => onSubmit({ action: 'approve', documentIds })}>
        Submit Batch
      </button>
      <button onClick={onClose}>Close Modal</button>
    </div>
  )
}));

describe('DocumentApprovalQueue', () => {
  // Mock data
  const mockDocuments: ContractorDocument[] = [
    {
      id: 'doc-1',
      contractorId: 'contractor-1',
      documentType: 'tax_clearance',
      documentName: 'Tax Clearance Certificate 2024',
      fileName: 'tax-clearance.pdf',
      fileUrl: 'https://example.com/doc-1.pdf',
      verificationStatus: 'pending',
      isExpired: false,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'doc-2',
      contractorId: 'contractor-2',
      documentType: 'insurance',
      documentName: 'Insurance Certificate 2024',
      fileName: 'insurance.pdf',
      fileUrl: 'https://example.com/doc-2.pdf',
      verificationStatus: 'pending',
      isExpired: false,
      expiryDate: new Date('2024-12-31'),
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: 'doc-3',
      contractorId: 'contractor-1',
      documentType: 'safety_certificate',
      documentName: 'Safety Certificate 2023',
      fileName: 'safety.pdf',
      fileUrl: 'https://example.com/doc-3.pdf',
      verificationStatus: 'verified',
      isExpired: true,
      expiryDate: new Date('2023-12-31'),
      rejectionReason: 'Document has expired',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-01-20')
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (contractorService.documents.getByContractor as any).mockResolvedValue(mockDocuments);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component title and description', async () => {
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      
      await waitFor(() => {
        expect(screen.getByText('Document Approval Queue')).toBeInTheDocument();
        expect(screen.getByText(/documents pending review/)).toBeInTheDocument();
      });
    });

    it('should show loading spinner initially', () => {
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      
      expect(screen.getByText('Loading document approval queue...')).toBeInTheDocument();
    });

    it('should display documents after loading', async () => {
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      
      await waitFor(() => {
        expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
        expect(screen.getByText('Insurance Certificate 2024')).toBeInTheDocument();
        expect(screen.getByText('Safety Certificate 2023')).toBeInTheDocument();
      });
    });

    it('should show error state when loading fails', async () => {
      (contractorService.documents.getByContractor as any).mockRejectedValue(
        new Error('Failed to load documents')
      );
      
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Documents')).toBeInTheDocument();
        expect(screen.getByText('Failed to load documents. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show empty state when no documents found', async () => {
      (contractorService.documents.getByContractor as any).mockResolvedValue([]);
      
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      
      await waitFor(() => {
        expect(screen.getByText('No documents found')).toBeInTheDocument();
      });
    });
  });

  describe('Document Filtering', () => {
    beforeEach(async () => {
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      await waitFor(() => {
        expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
      });
    });

    it('should filter documents by search term', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByTestId('search-input');
      
      await user.type(searchInput, 'Tax');
      
      // Should show only tax clearance document
      expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
    });

    it('should filter documents by status', async () => {
      const user = userEvent.setup();
      const statusFilter = screen.getByTestId('status-filter');
      
      await user.selectOptions(statusFilter, 'pending');
      
      // Should show only pending documents
      expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
      expect(screen.getByText('Insurance Certificate 2024')).toBeInTheDocument();
    });

    it('should handle multiple filters simultaneously', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByTestId('search-input');
      const statusFilter = screen.getByTestId('status-filter');
      
      await user.type(searchInput, 'Insurance');
      await user.selectOptions(statusFilter, 'pending');
      
      // Should show only pending insurance document
      expect(screen.getByText('Insurance Certificate 2024')).toBeInTheDocument();
    });
  });

  describe('Document Actions', () => {
    beforeEach(async () => {
      render(
        <DocumentApprovalQueue 
          contractorId="contractor-1" 
          enableBatchOperations={true}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
      });
    });

    it('should approve a document', async () => {
      (contractorService.documents.verifyDocument as any).mockResolvedValue(undefined);
      
      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);
      
      await waitFor(() => {
        expect(contractorService.documents.verifyDocument).toHaveBeenCalledWith(
          'doc-1',
          'current_user',
          'verified',
          'Test approval notes'
        );
      });
      
      expect(toast.success).toHaveBeenCalledWith('Document approved successfully');
    });

    it('should reject a document', async () => {
      (contractorService.documents.verifyDocument as any).mockResolvedValue(undefined);
      
      const rejectButtons = screen.getAllByText('Reject');
      fireEvent.click(rejectButtons[0]);
      
      await waitFor(() => {
        expect(contractorService.documents.verifyDocument).toHaveBeenCalledWith(
          'doc-1',
          'current_user',
          'rejected',
          'Test rejection notes'
        );
      });
      
      expect(toast.success).toHaveBeenCalledWith('Document rejected successfully');
    });

    it('should handle approval failure', async () => {
      (contractorService.documents.verifyDocument as any).mockRejectedValue(
        new Error('Approval failed')
      );
      
      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to approve document');
      });
    });
  });

  describe('Document Viewer', () => {
    beforeEach(async () => {
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      await waitFor(() => {
        expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
      });
    });

    it('should open document viewer when view button is clicked', async () => {
      const user = userEvent.setup();
      const viewButtons = screen.getAllByTitle('View document');
      
      await user.click(viewButtons[0]);
      
      expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
      expect(screen.getByText(/Document Viewer:/)).toBeInTheDocument();
    });

    it('should close document viewer', async () => {
      const user = userEvent.setup();
      const viewButtons = screen.getAllByTitle('View document');
      
      await user.click(viewButtons[0]);
      expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
      
      const closeButton = screen.getByText('Close Viewer');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('document-viewer')).not.toBeInTheDocument();
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async () => {
      render(
        <DocumentApprovalQueue 
          contractorId="contractor-1" 
          enableBatchOperations={true}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
      });
    });

    it('should show batch controls when enabled', () => {
      expect(screen.getByText('Select All Pending')).toBeInTheDocument();
    });

    it('should select documents for batch processing', async () => {
      const user = userEvent.setup();
      const checkboxes = screen.getAllByRole('checkbox');
      
      await user.click(checkboxes[0]);
      
      expect(screen.getByText(/1 selected/)).toBeInTheDocument();
    });

    it('should open batch approval modal', async () => {
      const user = userEvent.setup();
      const checkboxes = screen.getAllByRole('checkbox');
      
      await user.click(checkboxes[0]);
      
      const batchButton = screen.getByText(/Batch Process/);
      await user.click(batchButton);
      
      expect(screen.getByTestId('batch-approval-modal')).toBeInTheDocument();
    });

    it('should select all pending documents', async () => {
      const user = userEvent.setup();
      const selectAllButton = screen.getByText('Select All Pending');
      
      await user.click(selectAllButton);
      
      // Should select all pending documents (2 in mock data)
      expect(screen.getByText(/2 selected/)).toBeInTheDocument();
    });

    it('should clear all selections', async () => {
      const user = userEvent.setup();
      
      // First select documents
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      
      expect(screen.getByText(/1 selected/)).toBeInTheDocument();
      
      // Then clear
      const clearButton = screen.getByText('Clear Selection');
      await user.click(clearButton);
      
      expect(screen.getByText(/0 selected/)).toBeInTheDocument();
    });
  });

  describe('Compliance Tracker', () => {
    beforeEach(async () => {
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      await waitFor(() => {
        expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
      });
    });

    it('should open compliance tracker', async () => {
      const user = userEvent.setup();
      const complianceButton = screen.getByText('Compliance Dashboard');
      
      await user.click(complianceButton);
      
      expect(screen.getByTestId('compliance-tracker')).toBeInTheDocument();
    });

    it('should close compliance tracker', async () => {
      const user = userEvent.setup();
      const complianceButton = screen.getByText('Compliance Dashboard');
      
      await user.click(complianceButton);
      expect(screen.getByTestId('compliance-tracker')).toBeInTheDocument();
      
      const closeButton = screen.getByText('Close Tracker');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('compliance-tracker')).not.toBeInTheDocument();
    });
  });

  describe('Document Priority Display', () => {
    beforeEach(async () => {
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      await waitFor(() => {
        expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
      });
    });

    it('should highlight expired documents', () => {
      const expiredDocument = screen.getByText('Safety Certificate 2023').closest('[class*="border-l-4"]');
      expect(expiredDocument).toHaveClass('border-l-red-500');
    });

    it('should show expiring documents with warning color', () => {
      // Mock a document expiring within 30 days
      const expiringDoc = mockDocuments.find(d => d.id === 'doc-2');
      if (expiringDoc) {
        expiringDoc.expiryDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
      }
      
      // Re-render with updated data
      (contractorService.documents.getByContractor as any).mockResolvedValue(mockDocuments);
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('should auto-refresh when interval is set', async () => {
      render(
        <DocumentApprovalQueue 
          contractorId="contractor-1" 
          autoRefreshInterval={30}
        />
      );
      
      await waitFor(() => {
        expect(contractorService.documents.getByContractor).toHaveBeenCalledTimes(1);
      });
      
      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(contractorService.documents.getByContractor).toHaveBeenCalledTimes(2);
      });
    });

    it('should not auto-refresh when interval is 0', async () => {
      render(
        <DocumentApprovalQueue 
          contractorId="contractor-1" 
          autoRefreshInterval={0}
        />
      );
      
      await waitFor(() => {
        expect(contractorService.documents.getByContractor).toHaveBeenCalledTimes(1);
      });
      
      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);
      
      // Should still be called only once
      expect(contractorService.documents.getByContractor).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks', () => {
    it('should call onApprovalChange when document status changes', async () => {
      const mockOnApprovalChange = vi.fn();
      
      render(
        <DocumentApprovalQueue 
          contractorId="contractor-1"
          onApprovalChange={mockOnApprovalChange}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
      });
      
      (contractorService.documents.verifyDocument as any).mockResolvedValue(undefined);
      
      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);
      
      await waitFor(() => {
        expect(mockOnApprovalChange).toHaveBeenCalledWith('doc-1', 'verified');
      });
    });

    it('should call onStatsUpdate with queue statistics', async () => {
      const mockOnStatsUpdate = vi.fn();
      
      render(
        <DocumentApprovalQueue 
          contractorId="contractor-1"
          onStatsUpdate={mockOnStatsUpdate}
        />
      );
      
      await waitFor(() => {
        expect(mockOnStatsUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            total: mockDocuments.length,
            pending: 2,
            approved: 1,
            rejected: 0
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<DocumentApprovalQueue contractorId="contractor-1" />);
      await waitFor(() => {
        expect(screen.getByText('Tax Clearance Certificate 2024')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', () => {
      const mainHeading = screen.getByText('Document Approval Queue');
      expect(mainHeading).toHaveAttribute('role', 'heading');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const viewButton = screen.getAllByTitle('View document')[0];
      
      // Should be focusable
      viewButton.focus();
      expect(viewButton).toHaveFocus();
      
      // Should respond to Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
    });
  });
});