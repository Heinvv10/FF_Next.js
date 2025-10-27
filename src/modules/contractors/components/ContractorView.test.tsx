/**
 * Tests for ContractorView Component
 * Tests rendering, tabs, loading states, and error handling
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ContractorView } from './ContractorView';
import type { Contractor } from '@/types/contractor.types';

// Mock dependencies
vi.mock('@/services/contractorService', () => ({
  contractorService: {
    getById: vi.fn(),
    delete: vi.fn()
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

// Create mockable hook with default return value
const { mockUseContractorView } = vi.hoisted(() => ({
  mockUseContractorView: vi.fn(() => ({
    id: 'contractor-123',
    contractor: mockContractor,
    isLoading: false,
    showDeleteConfirm: false,
    setShowDeleteConfirm: vi.fn(),
    isDeleting: false,
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    handleDelete: vi.fn(),
    navigate: vi.fn()
  }))
}));

// Mock child components to simplify testing
vi.mock('./view', () => ({
  useContractorView: mockUseContractorView,
  ContractorViewHeader: ({ contractor }: any) => (
    <div data-testid="contractor-header">{contractor?.companyName}</div>
  ),
  ContractorTabs: ({ activeTab }: any) => (
    <div data-testid="contractor-tabs">{activeTab}</div>
  ),
  TabContent: ({ activeTab }: any) => (
    <div data-testid="tab-content">{activeTab} content</div>
  ),
  DeleteConfirmModal: () => <div data-testid="delete-modal">Delete Confirm</div>,
  ContractorNotFound: () => <div data-testid="not-found">Not Found</div>
}));

vi.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ label }: any) => <div data-testid="loading-spinner">{label}</div>
}));

describe('ContractorView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock implementation
    mockUseContractorView.mockReturnValue({
      id: 'contractor-123',
      contractor: mockContractor,
      isLoading: false,
      showDeleteConfirm: false,
      setShowDeleteConfirm: vi.fn(),
      isDeleting: false,
      activeTab: 'overview',
      setActiveTab: vi.fn(),
      handleDelete: vi.fn(),
      navigate: vi.fn()
    });
  });

  describe('Rendering', () => {
    it('should render contractor view with header and tabs', () => {
      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('contractor-header')).toBeInTheDocument();
      expect(screen.getByText('Test Contractor Inc')).toBeInTheDocument();
      expect(screen.getByTestId('contractor-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content')).toBeInTheDocument();
    });

    it('should render overview tab by default', () => {
      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('overview')).toBeInTheDocument();
      expect(screen.getByText('overview content')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      // Mock useContractorView to return loading state
      mockUseContractorView.mockReturnValue({
        id: 'contractor-123',
        contractor: null,
        isLoading: true,
        showDeleteConfirm: false,
        setShowDeleteConfirm: vi.fn(),
        isDeleting: false,
        activeTab: 'overview',
        setActiveTab: vi.fn(),
        handleDelete: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading contractor...')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should display not found message when contractor is null', () => {
      // Mock useContractorView to return no contractor
      mockUseContractorView.mockReturnValue({
        id: 'contractor-123',
        contractor: null,
        isLoading: false,
        showDeleteConfirm: false,
        setShowDeleteConfirm: vi.fn(),
        isDeleting: false,
        activeTab: 'overview',
        setActiveTab: vi.fn(),
        handleDelete: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('not-found')).toBeInTheDocument();
      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete confirmation modal when delete is triggered', () => {
      // Mock useContractorView to show delete confirm
      mockUseContractorView.mockReturnValue({
        id: 'contractor-123',
        contractor: mockContractor,
        isLoading: false,
        showDeleteConfirm: true,
        setShowDeleteConfirm: vi.fn(),
        isDeleting: false,
        activeTab: 'overview',
        setActiveTab: vi.fn(),
        handleDelete: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
      expect(screen.getByText('Delete Confirm')).toBeInTheDocument();
    });

    it('should not show delete modal by default', () => {
      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should display teams tab when active', () => {
      mockUseContractorView.mockReturnValue({
        id: 'contractor-123',
        contractor: mockContractor,
        isLoading: false,
        showDeleteConfirm: false,
        setShowDeleteConfirm: vi.fn(),
        isDeleting: false,
        activeTab: 'teams',
        setActiveTab: vi.fn(),
        handleDelete: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('teams')).toBeInTheDocument();
      expect(screen.getByText('teams content')).toBeInTheDocument();
    });

    it('should display documents tab when active', () => {
      mockUseContractorView.mockReturnValue({
        id: 'contractor-123',
        contractor: mockContractor,
        isLoading: false,
        showDeleteConfirm: false,
        setShowDeleteConfirm: vi.fn(),
        isDeleting: false,
        activeTab: 'documents',
        setActiveTab: vi.fn(),
        handleDelete: vi.fn(),
        navigate: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('documents')).toBeInTheDocument();
      expect(screen.getByText('documents content')).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should render with proper container classes', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      const mainDiv = container.querySelector('.max-w-6xl');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should render tabs within white card container', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      const cardDiv = container.querySelector('.bg-white.rounded-lg');
      expect(cardDiv).toBeInTheDocument();
    });
  });

  describe('Contractor Data Display', () => {
    it('should display contractor company name in header', () => {
      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Test Contractor Inc')).toBeInTheDocument();
    });

    it('should pass contractor data to tab content', () => {
      const { useContractorView } = vi.mocked(vi.importActual('./view') as any);

      render(
        <MemoryRouter initialEntries={['/contractors/contractor-123']}>
          <Routes>
            <Route path="/contractors/:id" element={<ContractorView />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('tab-content')).toBeInTheDocument();
    });
  });
});
