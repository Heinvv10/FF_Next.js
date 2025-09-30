'use client';

import React, { useState, useEffect } from 'react';
import DropsTable from '@/modules/drops-quality-control/components/DropsTable';
import ChecklistReviewModal from '@/modules/drops-quality-control/components/ChecklistReviewModal';
import { DropWithDetails } from '@/modules/drops-quality-control/types';

const DropsReviewsDashboard: React.FC = () => {
  const [drops, setDrops] = useState<DropWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDrop, setSelectedDrop] = useState<DropWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/drops/dashboard');
      const data = await response.json();
      setDrops(data.drops);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDrop = (drop: DropWithDetails) => {
    setSelectedDrop(drop);
    setIsModalOpen(true);
  };

  const handleSubmitReview = async (reviewData: any) => {
    try {
      const response = await fetch('/api/drops/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        await fetchDashboardData(); // Refresh data
        setIsModalOpen(false);
        setSelectedDrop(null);
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading DROPS Quality Control Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          DROPS Quality Control Dashboard
        </h1>
        <p className="text-gray-600">
          Review and manage Velocity Fibre 14-step Home Install Capture Checklist submissions
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Drops</p>
              <p className="text-3xl font-bold text-gray-900">{drops.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900">
                {drops.filter(d => d.qc_status === 'pending').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-gray-900">
                {drops.filter(d => d.qc_status === 'approved').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Rectification</p>
              <p className="text-3xl font-bold text-gray-900">
                {drops.filter(d => d.qc_status === 'needs-rectification').length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Average Completion Rate */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.round(drops.reduce((sum, drop) => sum + (drop.completed_steps / drop.total_steps), 0) / drops.length * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Average Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {drops.filter(d => d.completed_steps === d.total_steps).length}
            </div>
            <div className="text-sm text-gray-600">Complete Checklists</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {drops.filter(d => d.completed_steps > 0 && d.completed_steps < d.total_steps).length}
            </div>
            <div className="text-sm text-gray-600">Partial Checklists</div>
          </div>
        </div>
      </div>

      {/* Drops Table */}
      <DropsTable
        drops={drops}
        onReviewDrop={handleReviewDrop}
        onRefresh={fetchDashboardData}
      />

      {/* Review Modal */}
      {selectedDrop && (
        <ChecklistReviewModal
          drop={selectedDrop}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDrop(null);
          }}
          onSubmitReview={handleSubmitReview}
        />
      )}
    </div>
  );
};

export default DropsReviewsDashboard;