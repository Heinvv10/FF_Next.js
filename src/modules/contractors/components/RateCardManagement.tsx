/**
 * Rate Card Management Component
 * Main interface for managing contractor rate cards
 * Integrated into contractor profile for comprehensive rate management
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  FileText, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Archive, 
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react';

import { 
  ContractorRateCard, 
  RateCardSearchParams,
  RateCardManagementProps 
} from '@/types/contractor';
import { RateCardApiService } from '@/services/contractor';
import { formatDate } from '@/utils/dateHelpers';
import { formatCurrency } from '@/lib/utils';
import { log } from '@/lib/logger';

// 🟢 WORKING: Main Rate Card Management Component
export function RateCardManagement({ 
  contractorId, 
  onRateCardSelect,
  onRateCardCreate,
  onRateCardUpdate,
  onRateCardDelete
}: RateCardManagementProps) {
  const [rateCards, setRateCards] = useState<ContractorRateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useState<RateCardSearchParams>({
    contractorId,
    page: 1,
    limit: 20,
    sortBy: 'effectiveDate',
    sortOrder: 'desc'
  });

  // UI State
  const [selectedRateCard, setSelectedRateCard] = useState<ContractorRateCard | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

  // 🟢 WORKING: Load rate cards
  useEffect(() => {
    const loadRateCards = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await RateCardApiService.getRateCards(searchParams);
        setRateCards(response.data);
        
      } catch (err) {
        setError('Failed to load rate cards');
        log.error('Error loading rate cards:', { data: err }, 'RateCardManagement');
      } finally {
        setLoading(false);
      }
    };

    if (contractorId) {
      loadRateCards();
    }
  }, [contractorId, searchParams]);

  // 🟢 WORKING: Rate Card Actions
  const handleCreateRateCard = () => {
    setShowCreateModal(true);
  };

  const handleEditRateCard = (rateCard: ContractorRateCard) => {
    setSelectedRateCard(rateCard);
    setShowEditModal(true);
    onRateCardSelect?.(rateCard);
  };

  const handleViewRateCard = (rateCard: ContractorRateCard) => {
    onRateCardSelect?.(rateCard);
  };

  const handleCloneRateCard = async (rateCard: ContractorRateCard) => {
    try {
      const clonedCard = await RateCardApiService.cloneRateCard(rateCard.id, {
        name: `${rateCard.name} (Copy)`,
        effectiveDate: new Date().toISOString()
      });
      
      setRateCards(prev => [clonedCard, ...prev]);
      onRateCardCreate?.(clonedCard);
    } catch (err) {
      log.error('Error cloning rate card:', { data: err }, 'RateCardManagement');
      setError('Failed to clone rate card');
    }
  };

  const handleArchiveRateCard = async (rateCard: ContractorRateCard) => {
    if (!window.confirm('Are you sure you want to archive this rate card?')) {
      return;
    }

    try {
      const updatedCard = await RateCardApiService.updateRateCard(rateCard.id, {
        ...(rateCard as any),
        status: 'archived'
      });
      
      setRateCards(prev => prev.map(card => 
        card.id === rateCard.id ? updatedCard : card
      ));
      onRateCardUpdate?.(updatedCard);
    } catch (err) {
      log.error('Error archiving rate card:', { data: err }, 'RateCardManagement');
      setError('Failed to archive rate card');
    }
  };

  const handleDeleteRateCard = async (rateCard: ContractorRateCard) => {
    if (!window.confirm('Are you sure you want to delete this rate card? This action cannot be undone.')) {
      return;
    }

    try {
      await RateCardApiService.deleteRateCard(rateCard.id);
      setRateCards(prev => prev.filter(card => card.id !== rateCard.id));
      onRateCardDelete?.(rateCard.id);
    } catch (err) {
      log.error('Error deleting rate card:', { data: err }, 'RateCardManagement');
      setError('Failed to delete rate card');
    }
  };

  const handleSubmitForApproval = async (rateCard: ContractorRateCard) => {
    try {
      const updatedCard = await RateCardApiService.submitForApproval(rateCard.id);
      setRateCards(prev => prev.map(card => 
        card.id === rateCard.id ? updatedCard : card
      ));
      onRateCardUpdate?.(updatedCard);
    } catch (err) {
      log.error('Error submitting for approval:', { data: err }, 'RateCardManagement');
      setError('Failed to submit rate card for approval');
    }
  };

  // 🟢 WORKING: Status Badge Component
  const StatusBadge: React.FC<{ status: ContractorRateCard['status'] }> = ({ status }) => {
    const badgeStyles = {
      draft: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      draft: Clock,
      active: CheckCircle,
      archived: Archive
    };

    const IconComponent = icons[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[status]}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // 🟢 WORKING: Approval Status Badge Component
  const ApprovalBadge: React.FC<{ status: ContractorRateCard['approvalStatus'] }> = ({ status }) => {
    const badgeStyles = {
      pending: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: AlertTriangle
    };

    const IconComponent = icons[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[status]}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // 🟢 WORKING: Actions Menu Component
  const ActionsMenu: React.FC<{ rateCard: ContractorRateCard }> = ({ rateCard }) => {
    if (showActionsMenu !== rateCard.id) return null;

    return (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
        <div className="py-1">
          <button
            onClick={() => {
              handleViewRateCard(rateCard);
              setShowActionsMenu(null);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Eye className="w-4 h-4 mr-3" />
            View Details
          </button>
          <button
            onClick={() => {
              handleEditRateCard(rateCard);
              setShowActionsMenu(null);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            disabled={rateCard.status === 'archived'}
          >
            <Edit className="w-4 h-4 mr-3" />
            Edit
          </button>
          <button
            onClick={() => {
              handleCloneRateCard(rateCard);
              setShowActionsMenu(null);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Copy className="w-4 h-4 mr-3" />
            Clone
          </button>
          
          {rateCard.status === 'draft' && (
            <button
              onClick={() => {
                handleSubmitForApproval(rateCard);
                setShowActionsMenu(null);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <CheckCircle className="w-4 h-4 mr-3" />
              Submit for Approval
            </button>
          )}

          {rateCard.status !== 'archived' && (
            <button
              onClick={() => {
                handleArchiveRateCard(rateCard);
                setShowActionsMenu(null);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Archive className="w-4 h-4 mr-3" />
              Archive
            </button>
          )}

          <div className="border-t border-gray-100"></div>
          <button
            onClick={() => {
              handleDeleteRateCard(rateCard);
              setShowActionsMenu(null);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-3" />
            Delete
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading rate cards...</span>
      </div>
    );
  }

  return (
    <div className="rate-card-management">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rate Cards</h3>
          <p className="text-sm text-gray-500">Manage service rates and pricing for this contractor</p>
        </div>
        <button
          onClick={handleCreateRateCard}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Rate Card
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Rate Cards List */}
      {rateCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rate cards found</h3>
          <p className="text-gray-500 mb-4">
            Create your first rate card to start managing service rates for this contractor.
          </p>
          <button
            onClick={handleCreateRateCard}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Rate Card
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {rateCards.map(rateCard => (
            <div
              key={rateCard.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Rate Card Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{rateCard.name}</h4>
                    <StatusBadge status={rateCard.status} />
                    <ApprovalBadge status={rateCard.approvalStatus} />
                    {rateCard.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Rate Card Description */}
                  {rateCard.description && (
                    <p className="text-gray-600 mb-3">{rateCard.description}</p>
                  )}

                  {/* Rate Card Metrics */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Effective: {formatDate(rateCard.effectiveDate)}
                    </div>
                    {rateCard.expiryDate && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Expires: {formatDate(rateCard.expiryDate)}
                      </div>
                    )}
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {rateCard.totalServices} services
                    </div>
                    {rateCard.totalValue && (
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Total: {formatCurrency(rateCard.totalValue, rateCard.currency)}
                      </div>
                    )}
                  </div>

                  {/* Rejection reason (if applicable) */}
                  {rateCard.approvalStatus === 'rejected' && rateCard.rejectionReason && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {rateCard.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setShowActionsMenu(
                      showActionsMenu === rateCard.id ? null : rateCard.id
                    )}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <ActionsMenu rateCard={rateCard} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal - Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Rate Card</h3>
            <p className="text-gray-600 mb-4">
              Rate card creation form will be implemented here.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Placeholder */}
      {showEditModal && selectedRateCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Rate Card</h3>
            <p className="text-gray-600 mb-4">
              Editing: {selectedRateCard.name}
            </p>
            <p className="text-gray-600 mb-4">
              Rate card edit form will be implemented here.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRateCard(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRateCard(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {showActionsMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActionsMenu(null)}
        />
      )}
    </div>
  );
}