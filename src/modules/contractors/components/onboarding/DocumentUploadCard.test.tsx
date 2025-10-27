/**
 * Tests for DocumentUploadCard Component
 * Tests document upload, status display, and file management
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentUploadCard } from './DocumentUploadCard';
import type { ContractorDocument } from '@/types/contractor.types';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn()
  }
}));

vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn()
  }
}));

const mockDocument: ContractorDocument = {
  id: 'doc-1',
  contractorId: 'contractor-123',
  documentType: 'tax_clearance',
  fileName: 'tax-clearance-2024.pdf',
  fileUrl: 'https://storage.example.com/tax-clearance.pdf',
  fileSize: 524288,
  uploadedAt: new Date('2024-01-15'),
  uploadedBy: 'user-1',
  status: 'approved',
  expiryDate: new Date('2025-12-31'),
  verifiedAt: new Date('2024-01-16'),
  verifiedBy: 'admin-1',
  notes: 'Document verified and approved',
  version: 1,
  isActive: true
};

// Create mockable hook
const { mockUseDocumentUpload } = vi.hoisted(() => ({
  mockUseDocumentUpload: vi.fn(() => ({
    isUploading: false,
    uploadProgress: 0,
    handleFileSelect: vi.fn(),
    handleRemoveDocument: vi.fn(),
    handleViewDocument: vi.fn(),
    handleDownloadDocument: vi.fn()
  }))
}));

// Mock the hook
vi.mock('./DocumentUploadCard/hooks/useDocumentUpload', () => ({
  useDocumentUpload: mockUseDocumentUpload
}));

// Mock child components
vi.mock('./DocumentUploadCard/components/DocumentStatus', () => ({
  DocumentStatus: ({ currentDocument }: any) => (
    <div data-testid="document-status">
      {currentDocument ? currentDocument.status : 'no document'}
    </div>
  )
}));

vi.mock('./DocumentUploadCard/components/DocumentInfo', () => ({
  DocumentInfo: ({ currentDocument, onViewDocument, onDownloadDocument, onRemoveDocument }: any) => (
    <div data-testid="document-info">
      <span>{currentDocument.fileName}</span>
      <button onClick={onViewDocument} data-testid="view-btn">View</button>
      <button onClick={onDownloadDocument} data-testid="download-btn">Download</button>
      <button onClick={onRemoveDocument} data-testid="remove-btn">Remove</button>
    </div>
  )
}));

vi.mock('./DocumentUploadCard/components/UploadButton', () => ({
  UploadButton: ({ isUploading, uploadProgress, onFileSelect }: any) => (
    <button
      onClick={onFileSelect}
      disabled={isUploading}
      data-testid="upload-button"
    >
      {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Document'}
    </button>
  )
}));

vi.mock('./DocumentUploadCard/types/documentUpload.types', () => ({
  DOCUMENT_TYPE_LABELS: {
    tax_clearance: 'Tax Clearance Certificate',
    bee_certificate: 'BEE Certificate',
    company_registration: 'Company Registration',
    proof_of_banking: 'Proof of Banking'
  }
}));

vi.mock('./DocumentUploadCard/utils/documentUtils', () => ({
  getStatusColor: (doc: any) => {
    if (!doc) return 'border-gray-300';
    if (doc.status === 'approved') return 'border-green-500';
    if (doc.status === 'pending') return 'border-yellow-500';
    if (doc.status === 'rejected') return 'border-red-500';
    return 'border-gray-300';
  }
}));

describe('DocumentUploadCard', () => {
  const mockOnUploadComplete = vi.fn();
  const mockOnDocumentRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock
    mockUseDocumentUpload.mockReturnValue({
      isUploading: false,
      uploadProgress: 0,
      handleFileSelect: vi.fn(),
      handleRemoveDocument: vi.fn(),
      handleViewDocument: vi.fn(),
      handleDownloadDocument: vi.fn()
    });
  });

  describe('Rendering', () => {
    it('should render document card with title', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance Certificate"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByText('Tax Clearance Certificate')).toBeInTheDocument();
    });

    it('should render with default label if no title provided', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="bee_certificate"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByText('BEE Certificate')).toBeInTheDocument();
    });

    it('should display required indicator when required', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          required={true}
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      const title = screen.getByText('Tax Clearance');
      const required = title.parentElement?.querySelector('.text-red-500');
      expect(required).toBeInTheDocument();
    });

    it('should display description when provided', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          description="Upload your latest tax clearance certificate"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByText('Upload your latest tax clearance certificate')).toBeInTheDocument();
    });
  });

  describe('Document Status', () => {
    it('should render document status component', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByTestId('document-status')).toBeInTheDocument();
    });

    it('should show no document status when no document uploaded', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByTestId('document-status')).toHaveTextContent('no document');
    });

    it('should show approved status when document is approved', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          currentDocument={mockDocument}
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByTestId('document-status')).toHaveTextContent('approved');
    });
  });

  describe('Document Info', () => {
    it('should not render document info when no document', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.queryByTestId('document-info')).not.toBeInTheDocument();
    });

    it('should render document info when document exists', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          currentDocument={mockDocument}
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByTestId('document-info')).toBeInTheDocument();
      expect(screen.getByText('tax-clearance-2024.pdf')).toBeInTheDocument();
    });

    it('should render action buttons for existing document', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          currentDocument={mockDocument}
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByTestId('view-btn')).toBeInTheDocument();
      expect(screen.getByTestId('download-btn')).toBeInTheDocument();
      expect(screen.getByTestId('remove-btn')).toBeInTheDocument();
    });
  });

  describe('Upload Functionality', () => {
    it('should render upload button', () => {
      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByTestId('upload-button')).toBeInTheDocument();
    });

    it('should call handleFileSelect when upload button clicked', () => {
      const mockHandleFileSelect = vi.fn();
      mockUseDocumentUpload.mockReturnValue({
        isUploading: false,
        uploadProgress: 0,
        handleFileSelect: mockHandleFileSelect,
        handleRemoveDocument: vi.fn(),
        handleViewDocument: vi.fn(),
        handleDownloadDocument: vi.fn()
      });

      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      fireEvent.click(screen.getByTestId('upload-button'));
      expect(mockHandleFileSelect).toHaveBeenCalled();
    });

    it('should disable upload button when uploading', () => {
      mockUseDocumentUpload.mockReturnValue({
        isUploading: true,
        uploadProgress: 45,
        handleFileSelect: vi.fn(),
        handleRemoveDocument: vi.fn(),
        handleViewDocument: vi.fn(),
        handleDownloadDocument: vi.fn()
      });

      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      const uploadBtn = screen.getByTestId('upload-button') as HTMLButtonElement;
      expect(uploadBtn.disabled).toBe(true);
    });

    it('should show upload progress when uploading', () => {
      mockUseDocumentUpload.mockReturnValue({
        isUploading: true,
        uploadProgress: 67,
        handleFileSelect: vi.fn(),
        handleRemoveDocument: vi.fn(),
        handleViewDocument: vi.fn(),
        handleDownloadDocument: vi.fn()
      });

      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      expect(screen.getByText('Uploading 67%')).toBeInTheDocument();
    });
  });

  describe('Document Actions', () => {
    it('should call handleViewDocument when view button clicked', () => {
      const mockHandleViewDocument = vi.fn();
      mockUseDocumentUpload.mockReturnValue({
        isUploading: false,
        uploadProgress: 0,
        handleFileSelect: vi.fn(),
        handleRemoveDocument: vi.fn(),
        handleViewDocument: mockHandleViewDocument,
        handleDownloadDocument: vi.fn()
      });

      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          currentDocument={mockDocument}
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      fireEvent.click(screen.getByTestId('view-btn'));
      expect(mockHandleViewDocument).toHaveBeenCalledWith(mockDocument);
    });

    it('should call handleDownloadDocument when download button clicked', () => {
      const mockHandleDownloadDocument = vi.fn();
      mockUseDocumentUpload.mockReturnValue({
        isUploading: false,
        uploadProgress: 0,
        handleFileSelect: vi.fn(),
        handleRemoveDocument: vi.fn(),
        handleViewDocument: vi.fn(),
        handleDownloadDocument: mockHandleDownloadDocument
      });

      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          currentDocument={mockDocument}
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      fireEvent.click(screen.getByTestId('download-btn'));
      expect(mockHandleDownloadDocument).toHaveBeenCalledWith(mockDocument);
    });

    it('should call handleRemoveDocument when remove button clicked', () => {
      const mockHandleRemoveDocument = vi.fn();
      mockUseDocumentUpload.mockReturnValue({
        isUploading: false,
        uploadProgress: 0,
        handleFileSelect: vi.fn(),
        handleRemoveDocument: mockHandleRemoveDocument,
        handleViewDocument: vi.fn(),
        handleDownloadDocument: vi.fn()
      });

      render(
        <DocumentUploadCard
          contractorId="contractor-123"
          documentType="tax_clearance"
          documentTitle="Tax Clearance"
          currentDocument={mockDocument}
          onUploadComplete={mockOnUploadComplete}
          onDocumentRemove={mockOnDocumentRemove}
        />
      );

      fireEvent.click(screen.getByTestId('remove-btn'));
      expect(mockHandleRemoveDocument).toHaveBeenCalledWith(mockDocument);
    });
  });
});
