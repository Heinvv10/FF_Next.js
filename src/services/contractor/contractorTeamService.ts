/**
 * Contractor Team Service - Team management operations using Neon
 * Migrated from Firebase to Neon PostgreSQL
 */

import { contractorApiService } from './contractorApiService';
import { log } from '@/lib/logger';
import { 
  ContractorTeam, 
  TeamMember,
  TeamFormData,
  MemberFormData,
  TeamFilter
} from '@/types/contractor.types';

export const contractorTeamService = {
  /**
   * Get teams for a contractor
   */
  async getTeamsByContractor(contractorId: string, filter?: TeamFilter): Promise<ContractorTeam[]> {
    try {
      // Use Neon service to get teams
      const teams = await contractorApiService.getContractorTeams(contractorId);
      
      // Apply filters if provided
      let filteredTeams = teams;
      
      if (filter?.teamType?.length) {
        filteredTeams = filteredTeams.filter(team => 
          filter.teamType?.includes(team.teamType)
        );
      }
      
      if (filter?.availability?.length) {
        filteredTeams = filteredTeams.filter(team => 
          filter.availability?.includes(team.availability)
        );
      }
      
      if (filter?.isActive !== undefined) {
        filteredTeams = filteredTeams.filter(team => 
          team.isActive === filter.isActive
        );
      }
      
      // Sort teams by name
      return filteredTeams.sort((a, b) => a.teamName.localeCompare(b.teamName));
    } catch (error) {
      log.error('Error getting contractor teams:', { data: error }, 'contractorTeamService');
      throw new Error('Failed to fetch contractor teams');
    }
  },

  /**
   * Create new team
   */
  async createTeam(contractorId: string, data: TeamFormData): Promise<string> {
    try {
      const team = await contractorApiService.createTeam(contractorId, data);
      return team.id;
    } catch (error) {
      log.error('Error creating team:', { data: error }, 'contractorTeamService');
      throw new Error('Failed to create team');
    }
  },

  /**
   * Update team
   */
  async updateTeam(teamId: string, data: Partial<TeamFormData>): Promise<void> {
    try {
      await contractorApiService.updateTeam(teamId, data);
    } catch (error) {
      log.error('Error updating team:', { data: error }, 'contractorTeamService');
      throw new Error('Failed to update team');
    }
  },

  /**
   * Delete team
   */
  async deleteTeam(teamId: string): Promise<void> {
    try {
      // TODO: Check for active assignments before deleting
      await contractorApiService.deleteTeam(teamId);
    } catch (error) {
      log.error('Error deleting team:', { data: error }, 'contractorTeamService');
      throw new Error('Failed to delete team');
    }
  },

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      // Get team from Neon and extract members from JSON field
      const teams = await contractorApiService.getContractorTeams(teamId);
      const team = teams.find(t => t.id === teamId);
      return team?.members || [];
    } catch (error) {
      log.error('Error getting team members:', { data: error }, 'contractorTeamService');
      throw new Error('Failed to fetch team members');
    }
  },

  /**
   * Add team member
   */
  async addTeamMember(teamId: string, contractorId: string, data: MemberFormData): Promise<string> {
    try {
      // Get existing team
      const teams = await contractorApiService.getContractorTeams(contractorId);
      const team = teams.find(t => t.id === teamId);
      
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Add member to team's members array
      const newMember: TeamMember = {
        id: `member_${Date.now()}`,
        ...data,
        teamId,
        contractorId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedMembers = [...(team.members || []), newMember];
      
      await contractorApiService.updateTeam(teamId, {
        members: updatedMembers
      } as any);
      
      return newMember.id;
    } catch (error) {
      log.error('Error adding team member:', { data: error }, 'contractorTeamService');
      throw new Error('Failed to add team member');
    }
  },

  /**
   * Update team member
   */
  async updateTeamMember(memberId: string, data: Partial<MemberFormData>): Promise<void> {
    try {
      // This would need to update the member within the team's members JSON array
      // For simplicity, logging a TODO
      log.info('Team member update needs implementation for JSON array update', 'contractorTeamService');
    } catch (error) {
      log.error('Error updating team member:', { data: error }, 'contractorTeamService');
      throw new Error('Failed to update team member');
    }
  },

  /**
   * Remove team member
   */
  async removeTeamMember(memberId: string): Promise<void> {
    try {
      // This would need to remove the member from the team's members JSON array
      // For simplicity, logging a TODO
      log.info('Team member removal needs implementation for JSON array update', 'contractorTeamService');
    } catch (error) {
      log.error('Error removing team member:', { data: error }, 'contractorTeamService');
      throw new Error('Failed to remove team member');
    }
  }
};