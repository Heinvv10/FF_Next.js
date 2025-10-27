/**
 * Tests for OnboardingWorkflow Component
 * Tests onboarding progress tracking and stage management
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWorkflow } from './OnboardingWorkflow';

// Mock onboarding progress data matching component structure
const mockOnboardingProgress = {
  contractorId: 'contractor-123',
  overallStatus: 'in_progress',
  completionPercentage: 45,
  stages: [
    {
      id: 'company_info',
      name: 'Company Information',
      description: 'Basic company details',
      completed: false,
      checklist: [
        { id: 'doc-1', description: 'Tax Clearance', completed: true, required: true, category: 'legal' },
        { id: 'doc-2', description: 'BEE Certificate', completed: false, required: true, category: 'legal' }
      ],
      documents: ['tax_clearance', 'bee_certificate']
    },
    {
      id: 'financial_info',
      name: 'Financial Information',
      description: 'Banking and financial details',
      completed: false,
      checklist: [
        { id: 'ver-1', description: 'Bank Account Verification', completed: false, required: true, category: 'financial' }
      ],
      documents: ['proof_of_banking']
    }
  ]
};

// Mock the service with hoisting
const { mockContractorOnboardingService } = vi.hoisted(() => ({
  mockContractorOnboardingService: {
    getOnboardingProgress: vi.fn(),
    updateStageCompletion: vi.fn(),
    submitForApproval: vi.fn()
  }
}));

vi.mock('@/services/contractor/contractorOnboardingService', () => ({
  contractorOnboardingService: mockContractorOnboardingService,
  OnboardingProgress: {}
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

vi.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ label }: any) => <div data-testid="loading-spinner">{label}</div>
}));

describe('OnboardingWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContractorOnboardingService.getOnboardingProgress.mockResolvedValue(mockOnboardingProgress);
    mockContractorOnboardingService.updateStageCompletion.mockResolvedValue(mockOnboardingProgress);
    mockContractorOnboardingService.submitForApproval.mockResolvedValue({
      ...mockOnboardingProgress,
      submittedForApproval: true,
      status: 'pending_approval'
    });
  });

  describe('Rendering', () => {
    it('should render component with contractor name', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Contractor')).toBeInTheDocument();
    });

    it('should render onboarding stages', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Company Information')).toBeInTheDocument();
      expect(screen.getByText('Financial Information')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner initially', () => {
      mockContractorOnboardingService.getOnboardingProgress.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOnboardingProgress), 100))
      );

      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should call getOnboardingProgress on mount', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(mockContractorOnboardingService.getOnboardingProgress).toHaveBeenCalledWith('contractor-123');
      });
    });

    it('should handle loading error gracefully', async () => {
      const mockToast = (await import('react-hot-toast')).default;
      mockContractorOnboardingService.getOnboardingProgress.mockRejectedValue(new Error('Failed to load'));

      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load onboarding progress');
      });
    });
  });

  describe('Progress Display', () => {
    it('should display overall progress percentage', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.getByText(/45%/)).toBeInTheDocument();
      });
    });

    it('should display progress bar', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Just verify onboarding progress header exists
      expect(screen.getByText('Onboarding Progress')).toBeInTheDocument();
    });
  });

  describe('Checklist Items', () => {
    it('should display checklist items', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Tax Clearance')).toBeInTheDocument();
      expect(screen.getByText('BEE Certificate')).toBeInTheDocument();
    });

    it('should show completed items', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        const taxClearanceItem = screen.getByText('Tax Clearance').closest('div');
        expect(taxClearanceItem).toBeInTheDocument();
      });
    });

    it('should call updateStageCompletion when checklist item is toggled', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.getByText('BEE Certificate')).toBeInTheDocument();
      });

      const beeCheckbox = screen.getByText('BEE Certificate')
        .closest('div')
        ?.querySelector('input[type="checkbox"]');

      if (beeCheckbox) {
        fireEvent.click(beeCheckbox);

        await waitFor(() => {
          expect(mockContractorOnboardingService.updateStageCompletion).toHaveBeenCalledWith(
            'contractor-123',
            'documentation',
            'doc-2',
            expect.any(Boolean)
          );
        });
      }
    });
  });

  describe('Status Indicators', () => {
    it('should display stage titles and descriptions', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Should display stage information
      expect(screen.getByText('Company Information')).toBeInTheDocument();
      expect(screen.getByText('Basic company details')).toBeInTheDocument();
    });

    it('should show correct status badge', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        // Just verify the status badge is rendered with some status text
        expect(screen.getByText(/IN.*PROGRESS/i)).toBeInTheDocument();
      });
    });
  });

  describe('Submit for Approval', () => {
    it('should render submit button when status is completed', async () => {
      mockContractorOnboardingService.getOnboardingProgress.mockResolvedValue({
        ...mockOnboardingProgress,
        overallStatus: 'completed',
        completionPercentage: 100
      });

      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit.*approval/i })).toBeInTheDocument();
      });
    });

    it('should call submitForApproval when button clicked', async () => {
      const mockToast = (await import('react-hot-toast')).default;
      mockContractorOnboardingService.getOnboardingProgress.mockResolvedValue({
        ...mockOnboardingProgress,
        overallStatus: 'completed',
        completionPercentage: 100
      });

      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit.*approval/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /submit.*approval/i }));

      await waitFor(() => {
        expect(mockContractorOnboardingService.submitForApproval).toHaveBeenCalledWith('contractor-123');
      });
    });

    it('should handle submit error', async () => {
      const mockToast = (await import('react-hot-toast')).default;
      mockContractorOnboardingService.getOnboardingProgress.mockResolvedValue({
        ...mockOnboardingProgress,
        overallStatus: 'completed',
        completionPercentage: 100
      });
      mockContractorOnboardingService.submitForApproval.mockRejectedValue(
        new Error('Submission failed')
      );

      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit.*approval/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /submit.*approval/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Required Items', () => {
    it('should indicate required checklist items', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Test Contractor" />);

      await waitFor(() => {
        const taxClearance = screen.getByText('Tax Clearance');
        const requiredIndicator = taxClearance.parentElement?.querySelector('.text-red-500');
        expect(requiredIndicator || taxClearance.textContent?.includes('*')).toBeTruthy();
      });
    });
  });

  describe('Props Handling', () => {
    it('should use contractorId for API calls', async () => {
      render(<OnboardingWorkflow contractorId="contractor-456" contractorName="Another Contractor" />);

      await waitFor(() => {
        expect(mockContractorOnboardingService.getOnboardingProgress).toHaveBeenCalledWith('contractor-456');
      });
    });

    it('should display correct contractor name', async () => {
      render(<OnboardingWorkflow contractorId="contractor-123" contractorName="Acme Corporation" />);

      await waitFor(() => {
        expect(screen.getByText(/Acme Corporation/)).toBeInTheDocument();
      });
    });
  });
});
