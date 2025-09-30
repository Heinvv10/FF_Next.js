import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Download } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { Meeting, UpcomingMeeting } from './types/meeting.types';
import { mockMeetings, mockUpcoming } from './data/mockData';
import { FirefliesService } from './services/firefliesService';
import { MeetingStatsCards } from './components/MeetingStatsCards';
import { MeetingsList } from './components/MeetingsList';
import { MeetingsSidebar } from './components/MeetingsSidebar';
import { MeetingDetailModal } from './components/MeetingDetailModal';
import { FirefliesMeetingCard } from './components/FirefliesMeetingCard';

export function MeetingsDashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [, setShowNewMeetingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isSyncing, setIsSyncing] = useState(false);
  const [firefliesMeetings, setFirefliesMeetings] = useState<any[]>([]);
  const [selectedFirefliesMeeting, setSelectedFirefliesMeeting] = useState<any>(null);
  const [showFirefliesDetailModal, setShowFirefliesDetailModal] = useState(false);

  useEffect(() => {
    loadMeetings();
    loadFirefliesMeetings();
  }, []);

  const loadMeetings = () => {
    setMeetings(mockMeetings);
    setUpcomingMeetings(mockUpcoming);
  };

  const loadFirefliesMeetings = async () => {
    try {
      const meetings = await FirefliesService.fetchMeetings();
      setFirefliesMeetings(meetings);
    } catch (error) {
      console.error('Error loading Fireflies meetings:', error);
    }
  };

  const handleSyncFireflies = async () => {
    setIsSyncing(true);
    try {
      const result = await FirefliesService.syncMeetings();
      if (result.success) {
        await loadFirefliesMeetings();
        alert(`Successfully synced ${result.count} meetings`);
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredMeetings = activeTab === 'fireflies'
    ? firefliesMeetings
    : meetings.filter(meeting => {
        if (activeTab === 'upcoming') return meeting.status === 'scheduled';
        if (activeTab === 'past') return meeting.status === 'completed';
        if (activeTab === 'cancelled') return meeting.status === 'cancelled';
        return true;
      });

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingModal(true);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
  };

  const handleScheduleMeeting = () => {
    setShowNewMeetingModal(true);
  };

  const handleViewFirefliesMeeting = (meeting: any) => {
    setSelectedFirefliesMeeting(meeting);
    setShowFirefliesDetailModal(true);
  };

  return (
    <div className="ff-page-container">
      <DashboardHeader 
        title="Meetings Management"
        subtitle="Schedule, manage and track all meetings"
        actions={[
          {
            label: 'Schedule Meeting',
            icon: Plus as React.ComponentType<{ className?: string; }>,
            onClick: () => setShowNewMeetingModal(true),
            variant: 'primary'
          },
          {
            label: 'Sync Fireflies',
            icon: RefreshCw as React.ComponentType<{ className?: string; }>,
            onClick: handleSyncFireflies,
            variant: 'secondary',
            disabled: isSyncing,
            loading: isSyncing
          }
        ]}
      />

      <MeetingStatsCards meetings={meetings} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="ff-card mb-6">
            <div className="border-b">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {['upcoming', 'past', 'cancelled', 'fireflies', 'all'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {activeTab === 'fireflies' ? (
            <div className="space-y-4">
              {firefliesMeetings.length === 0 ? (
                <div className="ff-card">
                  <div className="p-8 text-center text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">No Fireflies meetings found</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Sync your Fireflies account to see meeting transcripts and summaries
                    </p>
                    <button
                      onClick={handleSyncFireflies}
                      disabled={isSyncing}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Syncing...
                        </>
                      ) : (
                        'Sync Fireflies'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                firefliesMeetings.map((meeting) => (
                  <FirefliesMeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onView={handleViewFirefliesMeeting}
                  />
                ))
              )}
            </div>
          ) : (
            <MeetingsList
              meetings={filteredMeetings}
              onEditMeeting={handleEditMeeting}
              onDeleteMeeting={handleDeleteMeeting}
            />
          )}
        </div>

        <MeetingsSidebar 
          upcomingMeetings={upcomingMeetings}
          meetings={meetings}
          onScheduleMeeting={handleScheduleMeeting}
        />
      </div>

      <MeetingDetailModal
        meeting={selectedMeeting}
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
      />

      {/* Fireflies Meeting Detail Modal */}
      {selectedFirefliesMeeting && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showFirefliesDetailModal ? '' : 'hidden'}`}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedFirefliesMeeting.title}
                  </h2>
                  <p className="text-gray-600">
                    {new Date(selectedFirefliesMeeting.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowFirefliesDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Summary */}
              {selectedFirefliesMeeting.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                  <p className="text-gray-700">{selectedFirefliesMeeting.summary}</p>
                </div>
              )}

              {/* Key Points */}
              {selectedFirefliesMeeting.bullet_points && selectedFirefliesMeeting.bullet_points.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Points</h3>
                  <ul className="space-y-2">
                    {selectedFirefliesMeeting.bullet_points.map((point: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Participants */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Participants</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFirefliesMeeting.participants?.map((participant: any, index: number) => (
                    <div key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                      {participant.name || participant.email}
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Transcript */}
              {selectedFirefliesMeeting.full_text && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Transcript</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedFirefliesMeeting.full_text}</p>
                  </div>
                </div>
              )}

              {/* Meeting Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <span className="text-sm text-gray-500">Duration</span>
                  <p className="font-medium">{Math.floor(selectedFirefliesMeeting.duration / 60)} minutes</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Meeting ID</span>
                  <p className="font-mono text-sm">{selectedFirefliesMeeting.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}