/**
 * Tests for contractorTeamService
 * Tests team management operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contractorTeamService } from './contractorTeamService';
import { contractorApiService } from './contractorApiService';
import type { ContractorTeam, TeamFormData, MemberFormData } from '@/types/contractor.types';

// Mock dependencies
vi.mock('./contractorApiService', () => ({
  contractorApiService: {
    getContractorTeams: vi.fn(),
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn()
  }
}));

vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

describe('contractorTeamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTeam: ContractorTeam = {
    id: 'team-123',
    contractorId: 'contractor-123',
    teamName: 'Installation Team A',
    teamType: 'installation',
    teamSize: 5,
    leadName: 'Bob Johnson',
    leadPhone: '1112223333',
    leadEmail: 'bob@test.com',
    leadCertification: 'PSIRA',
    members: [],
    specializations: ['Fiber Installation', 'Trenching'],
    equipmentAvailable: ['Trencher', 'Fiber Splicer'],
    serviceAreas: ['Cape Town', 'Stellenbosch'],
    availability: 'available',
    currentWorkload: 2,
    maxCapacity: 5,
    teamRating: 4.5,
    projectsCompleted: 20,
    averageCompletionTime: 15,
    isActive: true,
    lastAssignmentDate: new Date(),
    notes: 'Excellent team',
    createdBy: 'admin',
    updatedBy: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('getTeamsByContractor', () => {
    it('should get teams for contractor', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([mockTeam]);

      const result = await contractorTeamService.getTeamsByContractor('contractor-123');

      expect(result).toHaveLength(1);
      expect(result[0].teamName).toBe('Installation Team A');
      expect(contractorApiService.getContractorTeams).toHaveBeenCalledWith('contractor-123');
    });

    it('should filter teams by team type', async () => {
      const team2 = { ...mockTeam, id: 'team-124', teamType: 'maintenance' };
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([mockTeam, team2]);

      const result = await contractorTeamService.getTeamsByContractor('contractor-123', {
        teamType: ['installation']
      });

      expect(result).toHaveLength(1);
      expect(result[0].teamType).toBe('installation');
    });

    it('should filter teams by availability', async () => {
      const team2 = { ...mockTeam, id: 'team-124', availability: 'busy' };
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([mockTeam, team2]);

      const result = await contractorTeamService.getTeamsByContractor('contractor-123', {
        availability: ['available']
      });

      expect(result).toHaveLength(1);
      expect(result[0].availability).toBe('available');
    });

    it('should filter teams by isActive status', async () => {
      const team2 = { ...mockTeam, id: 'team-124', isActive: false };
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([mockTeam, team2]);

      const result = await contractorTeamService.getTeamsByContractor('contractor-123', {
        isActive: true
      });

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should sort teams by name', async () => {
      const team2 = { ...mockTeam, id: 'team-124', teamName: 'Alpha Team' };
      const team3 = { ...mockTeam, id: 'team-125', teamName: 'Zulu Team' };
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([
        mockTeam,
        team3,
        team2
      ]);

      const result = await contractorTeamService.getTeamsByContractor('contractor-123');

      expect(result[0].teamName).toBe('Alpha Team');
      expect(result[1].teamName).toBe('Installation Team A');
      expect(result[2].teamName).toBe('Zulu Team');
    });

    it('should handle empty result', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([]);

      const result = await contractorTeamService.getTeamsByContractor('contractor-123');

      expect(result).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockRejectedValue(
        new Error('API error')
      );

      await expect(
        contractorTeamService.getTeamsByContractor('contractor-123')
      ).rejects.toThrow('Failed to fetch contractor teams');
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
      const createdTeam = { ...mockTeam, ...mockTeamData, id: 'team-new' };
      vi.mocked(contractorApiService.createTeam).mockResolvedValue(createdTeam);

      const result = await contractorTeamService.createTeam('contractor-123', mockTeamData);

      expect(result).toBe('team-new');
      expect(contractorApiService.createTeam).toHaveBeenCalledWith('contractor-123', mockTeamData);
    });

    it('should handle API errors during team creation', async () => {
      vi.mocked(contractorApiService.createTeam).mockRejectedValue(new Error('API error'));

      await expect(
        contractorTeamService.createTeam('contractor-123', mockTeamData)
      ).rejects.toThrow('Failed to create team');
    });
  });

  describe('updateTeam', () => {
    it('should update team', async () => {
      vi.mocked(contractorApiService.updateTeam).mockResolvedValue(undefined);

      await expect(
        contractorTeamService.updateTeam('team-123', { teamName: 'Updated Team' })
      ).resolves.not.toThrow();

      expect(contractorApiService.updateTeam).toHaveBeenCalledWith('team-123', {
        teamName: 'Updated Team'
      });
    });

    it('should handle partial updates', async () => {
      vi.mocked(contractorApiService.updateTeam).mockResolvedValue(undefined);

      await expect(
        contractorTeamService.updateTeam('team-123', { availability: 'busy' })
      ).resolves.not.toThrow();

      expect(contractorApiService.updateTeam).toHaveBeenCalledWith('team-123', {
        availability: 'busy'
      });
    });

    it('should handle API errors during update', async () => {
      vi.mocked(contractorApiService.updateTeam).mockRejectedValue(new Error('API error'));

      await expect(
        contractorTeamService.updateTeam('team-123', { teamName: 'Updated' })
      ).rejects.toThrow('Failed to update team');
    });
  });

  describe('deleteTeam', () => {
    it('should delete team', async () => {
      vi.mocked(contractorApiService.deleteTeam).mockResolvedValue(undefined);

      await expect(contractorTeamService.deleteTeam('team-123')).resolves.not.toThrow();

      expect(contractorApiService.deleteTeam).toHaveBeenCalledWith('team-123');
    });

    it('should handle API errors during deletion', async () => {
      vi.mocked(contractorApiService.deleteTeam).mockRejectedValue(new Error('API error'));

      await expect(contractorTeamService.deleteTeam('team-123')).rejects.toThrow(
        'Failed to delete team'
      );
    });
  });

  describe('getTeamMembers', () => {
    const mockMember = {
      id: 'member-123',
      name: 'John Smith',
      role: 'Installer',
      phone: '1234567890',
      email: 'john@test.com',
      certification: 'PSIRA',
      teamId: 'team-123',
      contractorId: 'contractor-123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should get team members', async () => {
      const teamWithMembers = { ...mockTeam, members: [mockMember] };
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([teamWithMembers]);

      const result = await contractorTeamService.getTeamMembers('team-123');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Smith');
    });

    it('should return empty array when team has no members', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([mockTeam]);

      const result = await contractorTeamService.getTeamMembers('team-123');

      expect(result).toHaveLength(0);
    });

    it('should return empty array when team not found', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([]);

      const result = await contractorTeamService.getTeamMembers('team-nonexistent');

      expect(result).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockRejectedValue(new Error('API error'));

      await expect(contractorTeamService.getTeamMembers('team-123')).rejects.toThrow(
        'Failed to fetch team members'
      );
    });
  });

  describe('addTeamMember', () => {
    const mockMemberData: MemberFormData = {
      name: 'Jane Doe',
      role: 'Team Lead',
      phone: '0987654321',
      email: 'jane@test.com',
      certification: 'PSIRA'
    };

    it('should add team member', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([mockTeam]);
      vi.mocked(contractorApiService.updateTeam).mockResolvedValue(undefined);

      const result = await contractorTeamService.addTeamMember(
        'team-123',
        'contractor-123',
        mockMemberData
      );

      expect(result).toMatch(/^member_/);
      expect(contractorApiService.updateTeam).toHaveBeenCalled();
    });

    it('should throw error when team not found', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([]);

      await expect(
        contractorTeamService.addTeamMember('team-nonexistent', 'contractor-123', mockMemberData)
      ).rejects.toThrow('Failed to add team member');
    });

    it('should handle API errors', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockRejectedValue(new Error('API error'));

      await expect(
        contractorTeamService.addTeamMember('team-123', 'contractor-123', mockMemberData)
      ).rejects.toThrow('Failed to add team member');
    });
  });

  describe('updateTeamMember', () => {
    it('should log TODO for team member update', async () => {
      const mockMemberUpdate = { name: 'Updated Name' };

      await expect(
        contractorTeamService.updateTeamMember('member-123', mockMemberUpdate)
      ).resolves.not.toThrow();
    });

    it('should handle errors gracefully', async () => {
      const mockMemberUpdate = { name: 'Updated Name' };

      // Force an error by making log.info throw
      const { log } = await import('@/lib/logger');
      vi.mocked(log.info).mockImplementation(() => {
        throw new Error('Logger error');
      });

      await expect(
        contractorTeamService.updateTeamMember('member-123', mockMemberUpdate)
      ).rejects.toThrow('Failed to update team member');
    });
  });

  describe('removeTeamMember', () => {
    it('should log TODO for team member removal', async () => {
      await expect(contractorTeamService.removeTeamMember('member-123')).resolves.not.toThrow();
    });

    it('should handle errors gracefully', async () => {
      // Force an error by making log.info throw
      const { log } = await import('@/lib/logger');
      vi.mocked(log.info).mockImplementation(() => {
        throw new Error('Logger error');
      });

      await expect(contractorTeamService.removeTeamMember('member-123')).rejects.toThrow(
        'Failed to remove team member'
      );
    });
  });

  describe('Combined Filter Tests', () => {
    it('should apply multiple filters together', async () => {
      const team2 = { ...mockTeam, id: 'team-124', teamType: 'maintenance', availability: 'busy' };
      const team3 = {
        ...mockTeam,
        id: 'team-125',
        teamType: 'installation',
        availability: 'busy',
        isActive: false
      };
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([
        mockTeam,
        team2,
        team3
      ]);

      const result = await contractorTeamService.getTeamsByContractor('contractor-123', {
        teamType: ['installation'],
        availability: ['available'],
        isActive: true
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('team-123');
    });

    it('should return empty array when filters match nothing', async () => {
      vi.mocked(contractorApiService.getContractorTeams).mockResolvedValue([mockTeam]);

      const result = await contractorTeamService.getTeamsByContractor('contractor-123', {
        teamType: ['maintenance'] // mockTeam is 'installation'
      });

      expect(result).toHaveLength(0);
    });
  });
});
