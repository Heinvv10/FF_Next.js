import { Clock, Users, FileText, Eye } from 'lucide-react';

interface FirefliesMeetingCardProps {
  meeting: {
    id: string;
    title: string;
    created_at: string;
    participants: Array<{ email: string; name?: string }>;
    duration: number;
    summary?: string;
    bullet_points?: string[];
    full_text?: string;
  };
  onView: (meeting: any) => void;
}

export function FirefliesMeetingCard({ meeting, onView }: FirefliesMeetingCardProps) {
  const date = new Date(meeting.created_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const durationMinutes = Math.floor(meeting.duration / 60);

  return (
    <div className="ff-card p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {meeting.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formattedDate} at {formattedTime}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {meeting.participants?.length || 0} participants
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              {durationMinutes} min
            </div>
          </div>
        </div>
        <button
          onClick={() => onView(meeting)}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="View details"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>

      {meeting.summary && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {meeting.summary}
          </p>
        </div>
      )}

      {meeting.bullet_points && meeting.bullet_points.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {meeting.bullet_points.slice(0, 3).map((point, index) => (
              <li key={index} className="flex items-start">
                <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                {point}
              </li>
            ))}
            {meeting.bullet_points.length > 3 && (
              <li className="text-blue-600 font-medium">
                +{meeting.bullet_points.length - 3} more points
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {meeting.participants?.slice(0, 3).map((participant, index) => (
            <div
              key={index}
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
              title={participant.email || participant.name || 'Unknown participant'}
            >
              {participant.name ? participant.name.charAt(0).toUpperCase() : (participant.email ? participant.email.charAt(0).toUpperCase() : '?')}
            </div>
          ))}
          {meeting.participants && meeting.participants.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
              +{meeting.participants.length - 3}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Fireflies
          </span>
        </div>
      </div>
    </div>
  );
}