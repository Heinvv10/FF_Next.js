/**
 * Foto Review Page
 * AI-powered photo evaluation for installation drops
 */

import { useState, useMemo } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout';
import { Camera, AlertTriangle } from 'lucide-react';
import {
  PhotoGallery,
  AIEvaluationCard,
  EvaluationResults,
  FilterControls,
  type FilterOptions,
} from '@/modules/foto-review/components';
import { usePhotos } from '@/modules/foto-review/hooks/usePhotos';
import { useFotoEvaluation } from '@/modules/foto-review/hooks/useFotoEvaluation';
import type { DropRecord } from '@/modules/foto-review/types';

export default function FotoReviewPage() {
  const [selectedDR, setSelectedDR] = useState<DropRecord | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    project: 'all',
    startDate: '',
    endDate: '',
    status: 'all',
  });

  const { photos, isLoading, error, refresh } = usePhotos();
  const {
    evaluation,
    isEvaluating,
    error: evalError,
    evaluate,
    fetchEvaluation,
    sendFeedback,
    isSendingFeedback,
    feedbackError,
  } = useFotoEvaluation();

  // Extract unique projects for filter dropdown
  const projects = useMemo(() => {
    const uniqueProjects = new Set(photos.map((dr) => dr.project));
    return Array.from(uniqueProjects).sort();
  }, [photos]);

  // Apply filters to photos
  const filteredPhotos = useMemo(() => {
    return photos.filter((dr) => {
      // Project filter
      if (filters.project !== 'all' && dr.project !== filters.project) {
        return false;
      }

      // Date range filter
      if (filters.startDate && dr.date) {
        const drDate = new Date(dr.date);
        const startDate = new Date(filters.startDate);
        if (drDate < startDate) {
          return false;
        }
      }

      if (filters.endDate && dr.date) {
        const drDate = new Date(dr.date);
        const endDate = new Date(filters.endDate);
        // Set end date to end of day for inclusive filtering
        endDate.setHours(23, 59, 59, 999);
        if (drDate > endDate) {
          return false;
        }
      }

      // Status filter
      if (filters.status === 'evaluated' && !dr.evaluated) {
        return false;
      }
      if (filters.status === 'pending' && dr.evaluated) {
        return false;
      }

      return true;
    });
  }, [photos, filters]);

  const handleClearFilters = () => {
    setFilters({
      project: 'all',
      startDate: '',
      endDate: '',
      status: 'all',
    });
  };

  // Auto-fetch evaluation when DR is selected
  const handleSelectDR = async (dr: DropRecord) => {
    setSelectedDR(dr);

    // Fetch existing evaluation if available
    if (dr.evaluated) {
      await fetchEvaluation(dr.dr_number);
    }
  };

  // Handle AI evaluation
  const handleEvaluate = async () => {
    if (!selectedDR) return;

    try {
      await evaluate(selectedDR.dr_number);
      toast.success('AI evaluation completed successfully! 🤖');
    } catch (err) {
      toast.error(`Evaluation failed: ${evalError || 'Unknown error'}`);
    }
  };

  // Handle send feedback
  const handleSendFeedback = async () => {
    if (!selectedDR) return;

    try {
      await sendFeedback(selectedDR.dr_number);
      toast.success('Feedback sent successfully via WhatsApp! 📲');
    } catch (err) {
      toast.error(`Failed to send feedback: ${feedbackError || 'Unknown error'}`);
    }
  };

  return (
    <>
      <Head>
        <title>Photo Review | FibreFlow</title>
        <meta name="description" content="AI-powered installation photo evaluation" />
      </Head>

      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Camera className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Photo Review</h1>
            </div>
            <p className="text-gray-600">AI-powered installation photo evaluation</p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - DR List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Drop Records</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredPhotos.length} of {photos.length} DRs
                  </p>
                </div>

                {/* Filter Controls */}
                <FilterControls
                  projects={projects}
                  filters={filters}
                  onFilterChange={setFilters}
                  onClearFilters={handleClearFilters}
                />

                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-600">Loading drops...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={refresh}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredPhotos.length === 0 ? (
                  <div className="p-8 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {photos.length === 0
                        ? 'No DRs with photos found'
                        : 'No DRs match the selected filters'}
                    </p>
                    {photos.length > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto scroll-smooth">
                    {filteredPhotos.map((dr) => (
                      <button
                        key={dr.dr_number}
                        onClick={() => handleSelectDR(dr)}
                        className={`w-full text-left p-4 transition-all duration-200 hover:bg-gray-50 ${
                          selectedDR?.dr_number === dr.dr_number
                            ? 'bg-blue-50 border-l-4 border-blue-600 shadow-sm'
                            : 'hover:border-l-4 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{dr.dr_number}</span>
                          {dr.evaluated && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              Evaluated
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">{dr.project}</p>
                        <p className="text-xs text-gray-500">{dr.photos.length} photo{dr.photos.length !== 1 ? 's' : ''}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Area - Photo Gallery & Evaluation */}
            <div className="lg:col-span-2 space-y-6">
              {selectedDR ? (
                <>
                  {/* Photo Gallery */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Photos - {selectedDR.dr_number}
                    </h3>
                    <PhotoGallery photos={selectedDR.photos} dr_number={selectedDR.dr_number} />
                  </div>

                  {/* Evaluation Card */}
                  <AIEvaluationCard
                    dr_number={selectedDR.dr_number}
                    evaluation={evaluation}
                    isEvaluating={isEvaluating}
                    onEvaluate={handleEvaluate}
                    onSendFeedback={handleSendFeedback}
                    isSendingFeedback={isSendingFeedback}
                  />

                  {/* Error Messages */}
                  {evalError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm font-medium">{evalError}</p>
                    </div>
                  )}

                  {feedbackError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm font-medium">{feedbackError}</p>
                    </div>
                  )}

                  {/* Detailed Results */}
                  {evaluation && <EvaluationResults evaluation={evaluation} />}
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Drop Record</h3>
                  <p className="text-gray-500">
                    Choose a DR from the list to view photos and run AI evaluation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}

// Use server-side props for authentication
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};
