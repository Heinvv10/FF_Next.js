/**
 * Tests for TeamManagement Component
 * Tests team display, creation, and management functionality
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamManagement } from './TeamManagement';
import type { ContractorTeam } from '@/types/contractor.types';

// Mock dependencies
vi.mock('@/services/contractor/contractorTeamService', () => ({
  contractorTeamService: {
    getTeamsByContractor: vi.fn(),
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn()
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

const mockTeams: ContractorTeam[] = [
  {
    id: 'team-1',
    contractorId: 'contractor-123',
    teamName: 'Installation Team A',
    teamType: 'installation',
    teamSize: 5,
    leadName: 'Bob Johnson',
    leadPhone: '1234567890',
    availability: 'available',
    isActive: true,
    members: [],
    specializations: [],
    equipmentAvailable: [],
    serviceAreas: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'team-2',
    contractorId: 'contractor-123',
    teamName: 'Maintenance Team B',
    teamType: 'maintenance',
    teamSize: 3,
    leadName: 'Alice Smith',
    leadPhone: '0987654321',
    availability: 'busy',
    isActive: true,
    members: [],
    specializations: [],
    equipmentAvailable: [],
    serviceAreas: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Create mockable hook
const { mockUseTeamManagement } = vi.hoisted(() => ({
  mockUseTeamManagement: vi.fn(() => ({
    teams: [],
    selectedTeam: null,
    teamMembers: [],
    isLoading: false,
    showTeamForm: false,
    showMemberForm: false,
    editingTeam: null,
    editingMember: null,
    setSelectedTeam: vi.fn(),
    setShowTeamForm: vi.fn(),
    setShowMemberForm: vi.fn(),
    setEditingTeam: vi.fn(),
    setEditingMember: vi.fn(),
    handleCreateTeam: vi.fn(),
    handleUpdateTeam: vi.fn(),
    handleDeleteTeam: vi.fn(),
    handleAddMember: vi.fn(),
    handleUpdateMember: vi.fn(),
    handleRemoveMember: vi.fn()
  }))
}));

// Mock the hook
vi.mock('./hooks/useTeamManagement', () => ({
  useTeamManagement: mockUseTeamManagement
}));

// Mock child components
vi.mock('./components', () => ({
  TeamsList: ({ teams, onCreateTeam }: any) => (
    <div data-testid="teams-list">
      {teams.length === 0 ? (
        <div data-testid="empty-teams">
          <button onClick={onCreateTeam} data-testid="create-team-btn">Create Team</button>
        </div>
      ) : (
        teams.map((team: any) => (
          <div key={team.id} data-testid={`team-${team.id}`}>
            {team.teamName}
          </div>
        ))
      )}
    </div>
  ),
  TeamDetails: ({ team }: any) => (
    <div data-testid="team-details">{team?.teamName} Details</div>
  ),
  TeamMembersList: ({ members }: any) => (
    <div data-testid="team-members-list">
      {members.length} members
    </div>
  ),
  EmptyTeamView: () => (
    <div data-testid="empty-team-view">Select a team to view details</div>
  )
}));

vi.mock('./TeamForm', () => ({
  TeamForm: ({ onSubmit }: any) => (
    <form data-testid="team-form" onSubmit={onSubmit}>
      <input data-testid="team-name-input" />
      <button type="submit">Create Team</button>
    </form>
  )
}));

vi.mock('./MemberForm', () => ({
  MemberForm: ({ onSubmit }: any) => (
    <form data-testid="member-form" onSubmit={onSubmit}>
      <input data-testid="member-name-input" />
      <button type="submit">Add Member</button>
    </form>
  )
}));

vi.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ label }: any) => <div data-testid="loading-spinner">{label}</div>
}));

describe('TeamManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock
    mockUseTeamManagement.mockReturnValue({
      teams: [],
      selectedTeam: null,
      teamMembers: [],
      isLoading: false,
      showTeamForm: false,
      showMemberForm: false,
      editingTeam: null,
      editingMember: null,
      setSelectedTeam: vi.fn(),
      setShowTeamForm: vi.fn(),
      setShowMemberForm: vi.fn(),
      setEditingTeam: vi.fn(),
      setEditingMember: vi.fn(),
      handleCreateTeam: vi.fn(),
      handleUpdateTeam: vi.fn(),
      handleDeleteTeam: vi.fn(),
      handleAddMember: vi.fn(),
      handleUpdateMember: vi.fn(),
      handleRemoveMember: vi.fn()
    });
  });

  describe('Rendering', () => {
    it('should render component with header', () => {
      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByText('Team Management')).toBeInTheDocument();
      expect(screen.getByText(/Manage teams and members for Test Contractor/)).toBeInTheDocument();
    });

    it('should render add team button', () => {
      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByRole('button', { name: /Add Team/i })).toBeInTheDocument();
    });

    it('should render teams list', () => {
      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByTestId('teams-list')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      mockUseTeamManagement.mockReturnValue({
        teams: [],
        selectedTeam: null,
        teamMembers: [],
        isLoading: true,
        showTeamForm: false,
        showMemberForm: false,
        editingTeam: null,
        editingMember: null,
        setSelectedTeam: vi.fn(),
        setShowTeamForm: vi.fn(),
        setShowMemberForm: vi.fn(),
        setEditingTeam: vi.fn(),
        setEditingMember: vi.fn(),
        handleCreateTeam: vi.fn(),
        handleUpdateTeam: vi.fn(),
        handleDeleteTeam: vi.fn(),
        handleAddMember: vi.fn(),
        handleUpdateMember: vi.fn(),
        handleRemoveMember: vi.fn()
      });

      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading teams...')).toBeInTheDocument();
    });
  });

  describe('Teams Display', () => {
    it('should display teams when available', () => {
      mockUseTeamManagement.mockReturnValue({
        teams: mockTeams,
        selectedTeam: null,
        teamMembers: [],
        isLoading: false,
        showTeamForm: false,
        showMemberForm: false,
        editingTeam: null,
        editingMember: null,
        setSelectedTeam: vi.fn(),
        setShowTeamForm: vi.fn(),
        setShowMemberForm: vi.fn(),
        setEditingTeam: vi.fn(),
        setEditingMember: vi.fn(),
        handleCreateTeam: vi.fn(),
        handleUpdateTeam: vi.fn(),
        handleDeleteTeam: vi.fn(),
        handleAddMember: vi.fn(),
        handleUpdateMember: vi.fn(),
        handleRemoveMember: vi.fn()
      });

      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByText('Installation Team A')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Team B')).toBeInTheDocument();
    });

    it('should show empty team view when no team selected', () => {
      mockUseTeamManagement.mockReturnValue({
        teams: mockTeams,
        selectedTeam: null,
        teamMembers: [],
        isLoading: false,
        showTeamForm: false,
        showMemberForm: false,
        editingTeam: null,
        editingMember: null,
        setSelectedTeam: vi.fn(),
        setShowTeamForm: vi.fn(),
        setShowMemberForm: vi.fn(),
        setEditingTeam: vi.fn(),
        setEditingMember: vi.fn(),
        handleCreateTeam: vi.fn(),
        handleUpdateTeam: vi.fn(),
        handleDeleteTeam: vi.fn(),
        handleAddMember: vi.fn(),
        handleUpdateMember: vi.fn(),
        handleRemoveMember: vi.fn()
      });

      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByTestId('empty-team-view')).toBeInTheDocument();
    });

    it('should show team details when team is selected', () => {
      mockUseTeamManagement.mockReturnValue({
        teams: mockTeams,
        selectedTeam: mockTeams[0],
        teamMembers: [],
        isLoading: false,
        showTeamForm: false,
        showMemberForm: false,
        editingTeam: null,
        editingMember: null,
        setSelectedTeam: vi.fn(),
        setShowTeamForm: vi.fn(),
        setShowMemberForm: vi.fn(),
        setEditingTeam: vi.fn(),
        setEditingMember: vi.fn(),
        handleCreateTeam: vi.fn(),
        handleUpdateTeam: vi.fn(),
        handleDeleteTeam: vi.fn(),
        handleAddMember: vi.fn(),
        handleUpdateMember: vi.fn(),
        handleRemoveMember: vi.fn()
      });

      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByTestId('team-details')).toBeInTheDocument();
      expect(screen.getByTestId('team-members-list')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty teams message when no teams', () => {
      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByTestId('empty-teams')).toBeInTheDocument();
    });

    it('should have create team button in empty state', () => {
      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      expect(screen.getByTestId('create-team-btn')).toBeInTheDocument();
    });
  });

  describe('Team Creation', () => {
    it('should call setShowTeamForm when add team button clicked', () => {
      const mockSetShowTeamForm = vi.fn();
      mockUseTeamManagement.mockReturnValue({
        teams: [],
        selectedTeam: null,
        teamMembers: [],
        isLoading: false,
        showTeamForm: false,
        showMemberForm: false,
        editingTeam: null,
        editingMember: null,
        setSelectedTeam: vi.fn(),
        setShowTeamForm: mockSetShowTeamForm,
        setShowMemberForm: vi.fn(),
        setEditingTeam: vi.fn(),
        setEditingMember: vi.fn(),
        handleCreateTeam: vi.fn(),
        handleUpdateTeam: vi.fn(),
        handleDeleteTeam: vi.fn(),
        handleAddMember: vi.fn(),
        handleUpdateMember: vi.fn(),
        handleRemoveMember: vi.fn()
      });

      render(<TeamManagement contractorId="contractor-123" contractorName="Test Contractor" />);

      fireEvent.click(screen.getByRole('button', { name: /Add Team/i }));

      expect(mockSetShowTeamForm).toHaveBeenCalledWith(true);
    });
  });

  describe('Props Handling', () => {
    it('should display contractor name in description', () => {
      render(<TeamManagement contractorId="contractor-123" contractorName="Acme Corporation" />);

      expect(screen.getByText(/Manage teams and members for Acme Corporation/)).toBeInTheDocument();
    });

    it('should pass contractorId to useTeamManagement hook', () => {
      render(<TeamManagement contractorId="contractor-456" contractorName="Test Corp" />);

      expect(mockUseTeamManagement).toHaveBeenCalledWith('contractor-456');
    });
  });
});
