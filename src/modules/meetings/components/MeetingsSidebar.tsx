import { Clock, Plus, Video, Calendar, FileText, User } from 'lucide-react';
import type { Meeting, UpcomingMeeting } from '../types/meeting.types';
import { getMeetingTypeColor } from '../utils/meetingUtils';

interface MeetingsSidebarProps {
  upcomingMeetings: UpcomingMeeting[];
  meetings: Meeting[];
  onScheduleMeeting: () => void;
}

export function MeetingsSidebar({ upcomingMeetings, meetings, onScheduleMeeting }: MeetingsSidebarProps) {
  const recentActionItems = meetings.flatMap(m => m.actionItems).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Today's Schedule */}
      <div className="ff-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Today's Schedule
          </h3>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{meeting.title}</p>
                  <p className="text-xs text-gray-600">{meeting.time} • {meeting.participants} participants</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getMeetingTypeColor(meeting.type)}`}>
                  {meeting.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Action Items */}
      <div className="ff-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Action Items</h3>
          <div className="space-y-3">
            {recentActionItems.map((item) => (
              <div key={item.id} className="border-l-2 border-blue-500 pl-3">
                <p className="text-sm font-medium">{item.task}</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600">{item.assignee}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600">Due {item.dueDate.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}