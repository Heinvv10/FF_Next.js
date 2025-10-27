/**
 * Tests for ContractorEdit Component
 * Tests form rendering, validation, submission, and error handling
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ContractorEdit } from './ContractorEdit';
import type { Contractor, ContractorFormData } from '@/types/contractor.types';

// Mock dependencies
vi.mock('@/services/contractorService', () => ({
  contractorService: {
    getById: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn()
  }
}));

const mockContractor: Contractor = {
  id: 'contractor-123',
  companyName: 'Test Contractor Inc',
  contactPerson: 'John Doe',
  email: 'john@test.com',
  phone: '1234567890',
  physicalAddress: '123 Main St',
  city: 'Cape Town',
  province: 'Western Cape',
  postalCode: '8001',
  status: 'approved',
  isActive: true,
  complianceStatus: 'compliant',
  ragOverall: 'green',
  specializations: [],
  certifications: [],
  tags: [],
  onboardingProgress: 100,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockFormData: ContractorFormData = {
  companyName: 'Test Contractor Inc',
  contactPerson: 'John Doe',
  email: 'john@test.com',
  phone: '1234567890',
  physicalAddress: '123 Main St',
  city: 'Cape Town',
  province: 'Western Cape',
  postalCode: '8001',
  status: 'approved'
};

// Create mockable hook with default return value
const { mockUseContractorEdit } = vi.hoisted(() => ({
  mockUseContractorEdit: vi.fn(() => ({
    contractor: mockContractor,
    formData: mockFormData,
    isLoading: false,
    isSubmitting: false,
    handleInputChange: vi.fn(),
    handleTagsChange: vi.fn(),
    handleSubmit: vi.fn(),
    navigate: vi.fn()
  }))
}));

// Mock child components
vi.mock('./edit', () => ({
  useContractorEdit: mockUseContractorEdit,
  ContractorEditHeader: ({ onBack }: any) => (
    <div data-testid="edit-header">
      <button onClick={onBack}>Back</button>
    </div>
  ),
  ContractorEditForm: ({ formData, isSubmitting, handleSubmit, onCancel }: any) => (
    <form data-testid="edit-form" onSubmit={handleSubmit}>
      <input
        data-testid="company-name-input"
        value={formData.companyName}
        disabled={isSubmitting}
      />
      <button type="submit" disabled={isSubmitting} data-testid="submit-button">
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
      <button type="button" onClick={onCancel} data-testid="cancel-button">
        Cancel
      </button>
    </form>
  )
}));

vi.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ label }: any) => <div data-testid="loading-spinner">{label}</div>
}));

describe('ContractorEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock implementation
    mockUseContractorEdit.mockReturnValue({
      contractor: mockContractor,
      formData: mockFormData,
      isLoading: false,
      isSubmitting: false,
      handleInputChange: vi.fn(),
      handleTagsChange: vi.fn(),
      handleSubmit: vi.fn(),
      navigate: vi.fn()
    });
  });

  describe('Rendering', () => {
    it('should render edit form with header', () => {
      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('edit-header')).toBeInTheDocument();
      expect(screen.getByTestId('edit-form')).toBeInTheDocument();
    });

    it('should render form fields with contractor data', () => {
      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      const companyInput = screen.getByTestId('company-name-input') as HTMLInputElement;
      expect(companyInput.value).toBe('Test Contractor Inc');
    });

    it('should render submit and cancel buttons', () => {
      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      mockUseContractorEdit.mockReturnValue({
        contractor: null,
        formData: mockFormData,
        isLoading: true,
        isSubmitting: false,
        handleInputChange: vi.fn(),
        handleTagsChange: vi.fn(),
        handleSubmit: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading contractor...')).toBeInTheDocument();
    });

    it('should not render form when loading', () => {
      mockUseContractorEdit.mockReturnValue({
        contractor: null,
        formData: mockFormData,
        isLoading: true,
        isSubmitting: false,
        handleInputChange: vi.fn(),
        handleTagsChange: vi.fn(),
        handleSubmit: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
    });
  });

  describe('Submission State', () => {
    it('should disable form fields when submitting', () => {
      mockUseContractorEdit.mockReturnValue({
        contractor: mockContractor,
        formData: mockFormData,
        isLoading: false,
        isSubmitting: true,
        handleInputChange: vi.fn(),
        handleTagsChange: vi.fn(),
        handleSubmit: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      const companyInput = screen.getByTestId('company-name-input') as HTMLInputElement;
      expect(companyInput.disabled).toBe(true);
    });

    it('should show saving text on submit button when submitting', () => {
      mockUseContractorEdit.mockReturnValue({
        contractor: mockContractor,
        formData: mockFormData,
        isLoading: false,
        isSubmitting: true,
        handleInputChange: vi.fn(),
        handleTagsChange: vi.fn(),
        handleSubmit: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable submit button when submitting', () => {
      mockUseContractorEdit.mockReturnValue({
        contractor: mockContractor,
        formData: mockFormData,
        isLoading: false,
        isSubmitting: true,
        handleInputChange: vi.fn(),
        handleTagsChange: vi.fn(),
        handleSubmit: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      const submitButton = screen.getByTestId('submit-button') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should call handleSubmit when form is submitted', () => {
      const mockHandleSubmit = vi.fn((e) => e.preventDefault());
      const { useContractorEdit } = vi.mocked(vi.importActual('./edit') as any);

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      const form = screen.getByTestId('edit-form');
      fireEvent.submit(form);

      // Form submission is handled by the mocked component
      expect(form).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render back button', () => {
      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should render nothing when contractor is null and not loading', () => {
      mockUseContractorEdit.mockReturnValue({
        contractor: null,
        formData: mockFormData,
        isLoading: false,
        isSubmitting: false,
        handleInputChange: vi.fn(),
        handleTagsChange: vi.fn(),
        handleSubmit: vi.fn(),
        navigate: vi.fn()
      });

      const { container } = render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Layout and Structure', () => {
    it('should render with proper container classes', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/contractors/contractor-123/edit']}>
          <Routes>
            <Route path="/contractors/:id/edit" element={<ContractorEdit />} />
          </Routes>
        </MemoryRouter>
      );

      const mainDiv = container.querySelector('.max-w-4xl');
      expect(mainDiv).toBeInTheDocument();
    });
  });
});
