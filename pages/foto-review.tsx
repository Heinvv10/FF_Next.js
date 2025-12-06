/**
 * Foto Review Page
 * AI-powered photo evaluation for installation drops
 */

import { useState } from 'react';
import Head from 'next/head';
import { AppLayout } from '@/components/layout';
import { Camera, AlertTriangle } from 'lucide-react';
import {
  PhotoGallery,
  AIEvaluationCard,
  EvaluationResults,
} from '@/modules/foto-review/components';
import { usePhotos } from '@/modules/foto-review/hooks/usePhotos';
import { useFotoEvaluation } from '@/modules/foto-review/hooks/useFotoEvaluation';
import type { DropRecord } from '@/modules/foto-review/types';

export default function FotoReviewPage() {
  const [selectedDR, setSelectedDR] = useState<DropRecord | null>(null);
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
    await evaluate(selectedDR.dr_number);
  };

  // Handle send feedback
  const handleSendFeedback = async () => {
    if (!selectedDR) return;

    try {
      await sendFeedback(selectedDR.dr_number);
      alert('Feedback sent successfully!');
    } catch (err) {
      alert(`Failed to send feedback: ${feedbackError || 'Unknown error'}`);
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
                  <p className="text-sm text-gray-600 mt-1">{photos.length} DRs with photos</p>
                </div>

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
                ) : photos.length === 0 ? (
                  <div className="p-8 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No DRs with photos found</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {photos.map((dr) => (
                      <button
                        key={dr.dr_number}
                        onClick={() => handleSelectDR(dr)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedDR?.dr_number === dr.dr_number ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">{dr.dr_number}</span>
                          {dr.evaluated && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Evaluated
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{dr.project}</p>
                        <p className="text-xs text-gray-500 mt-1">{dr.photos.length} photos</p>
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
