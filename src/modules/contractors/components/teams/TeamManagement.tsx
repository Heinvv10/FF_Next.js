/**
 * TeamManagement Component - Comprehensive team management for contractors
 * Following FibreFlow patterns with full CRUD operations for teams and members
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TeamForm } from './TeamForm';
import { MemberForm } from './MemberForm';
import { useTeamManagement } from './hooks/useTeamManagement';
import { TeamsList, TeamDetails, TeamMembersList, EmptyTeamView } from './components';

interface TeamManagementProps {
  contractorId: string;
  contractorName: string;
}

export function TeamManagement({ contractorId, contractorName }: TeamManagementProps) {
  const {
    teams,
    selectedTeam,
    teamMembers,
    isLoading,
    showTeamForm,
    showMemberForm,
    editingTeam,
    editingMember,
    setSelectedTeam,
    setShowTeamForm,
    setShowMemberForm,
    setEditingTeam,
    setEditingMember,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    handleAddMember,
    handleUpdateMember,
    handleRemoveMember
  } = useTeamManagement(contractorId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" label="Loading teams..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
          <p className="text-gray-600">Manage teams and members for {contractorName}</p>
        </div>
        <button
          onClick={() => setShowTeamForm(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <TeamsList
          teams={teams}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          onEditTeam={setEditingTeam}
          onDeleteTeam={handleDeleteTeam}
          onCreateTeam={() => setShowTeamForm(true)}
        />

        {/* Team Details & Members */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam ? (
            <>
              <TeamDetails team={selectedTeam} />
              <TeamMembersList
                members={teamMembers}
                onAddMember={() => setShowMemberForm(true)}
                onEditMember={setEditingMember}
                onRemoveMember={handleRemoveMember}
              />
            </>
          ) : (
            <EmptyTeamView />
          )}
        </div>
      </div>

      {/* Forms */}
      {showTeamForm && (
        <TeamForm
          onSubmit={handleCreateTeam}
          onCancel={() => setShowTeamForm(false)}
        />
      )}

      {editingTeam && (
        <TeamForm
          team={editingTeam}
          onSubmit={(data) => handleUpdateTeam(editingTeam.id, data)}
          onCancel={() => setEditingTeam(null)}
        />
      )}

      {showMemberForm && selectedTeam && (
        <MemberForm
          onSubmit={handleAddMember}
          onCancel={() => setShowMemberForm(false)}
        />
      )}

      {editingMember && (
        <MemberForm
          member={editingMember}
          onSubmit={(data) => handleUpdateMember(editingMember.id, data)}
          onCancel={() => setEditingMember(null)}
        />
      )}
    </div>
  );
}