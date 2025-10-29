import { X, Calendar, Clock, Video, MapPin, User } from 'lucide-react';
import type { Meeting } from '../types/meeting.types';

interface MeetingDetailModalProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingDetailModal({ meeting, isOpen, onClose }: MeetingDetailModalProps) {
  if (!isOpen || !meeting) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{meeting.title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Meeting Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium mb-3">Meeting Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{meeting.date.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{meeting.time} ({meeting.duration})</span>
                </div>
                <div className="flex items-center gap-2">
                  {meeting.isVirtual ? (
                    <>
                      <Video className="w-4 h-4 text-gray-400" />
                      <a href={meeting.meetingLink} className="text-blue-500 hover:underline">
                        Join Meeting
                      </a>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{meeting.location}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Organized by {meeting.organizer}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Participants ({meeting.participants.length})</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.participants.map((participant, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {participant}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Agenda */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Agenda</h3>
            <ol className="space-y-2">
              {meeting.agenda.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Action Items */}
          {meeting.actionItems.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Action Items</h3>
              <div className="space-y-2">
                {meeting.actionItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={item.completed} readOnly />
                      <div>
                        <p className="text-sm font-medium">{item.task}</p>
                        <p className="text-xs text-gray-600">
                          Assigned to {item.assignee} • Due {item.dueDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.completed ? 'completed' : 'pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fireflies Summary */}
          {(meeting as any).summary && (
            <div className="mt-6 space-y-6">
              {/* Overview */}
              {(meeting as any).summary.overview && (
                <div>
                  <h3 className="font-medium mb-3">Meeting Summary</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{(meeting as any).summary.overview}</p>
                </div>
              )}

              {/* Keywords */}
              {(meeting as any).summary.keywords && Array.isArray((meeting as any).summary.keywords) && (meeting as any).summary.keywords.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {(meeting as any).summary.keywords.map((keyword: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Outline */}
              {(meeting as any).summary.outline && Array.isArray((meeting as any).summary.outline) && (meeting as any).summary.outline.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Detailed Outline</h3>
                  <ol className="space-y-2">
                    {(meeting as any).summary.outline.map((item: string, index: number) => (
                      <li key={index} className="flex gap-2 text-sm text-gray-700">
                        <span className="font-medium text-gray-500">{index + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Action Items from Fireflies */}
              {(meeting as any).summary.action_items && (
                <div>
                  <h3 className="font-medium mb-3">AI-Detected Action Items</h3>
                  <div className="space-y-3">
                    {(() => {
                      let rawText = Array.isArray((meeting as any).summary.action_items)
                        ? (meeting as any).summary.action_items.join(' ')
                        : String((meeting as any).summary.action_items);

                      // Split by **Name** markers to separate action items by person
                      const personSections = rawText.split(/\*\*([^*]+)\*\*/);
                      const actionCards: JSX.Element[] = [];

                      for (let i = 1; i < personSections.length; i += 2) {
                        const person = personSections[i].trim();
                        const actionsText = personSections[i + 1];

                        if (!actionsText) continue;

                        // Split individual actions by timestamp pattern (time in parentheses)
                        // Match pattern: text (HH:MM) - this marks end of each action
                        const individualActions = actionsText.split(/(?=\w+.*?\(\d+:\d+\))/).filter(a => a.trim());

                        individualActions.forEach((actionText, actionIdx) => {
                          const trimmed = actionText.trim();
                          if (!trimmed) return;

                          // Extract timestamp from end of action
                          const timeMatch = trimmed.match(/\((\d+:\d+)\)\s*$/);
                          const timestamp = timeMatch ? timeMatch[1] : null;
                          const cleanAction = timestamp
                            ? trimmed.replace(/\s*\(\d+:\d+\)\s*$/, '').trim()
                            : trimmed;

                          actionCards.push(
                            <div key={`${i}-${actionIdx}`} className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-amber-600 text-white text-xs font-semibold rounded">
                                  {person}
                                </span>
                                {timestamp && (
                                  <span className="text-xs text-gray-500">
                                    {timestamp}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-800 leading-relaxed">
                                {cleanAction}
                              </p>
                            </div>
                          );
                        });
                      }

                      return actionCards.length > 0 ? actionCards : (
                        <div className="p-4 bg-amber-50 rounded-lg">
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {rawText}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Transcript Link */}
              {meeting.meetingLink && (
                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                  <a
                    href={meeting.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    View Full Transcript on Fireflies →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Fallback Notes */}
          {!((meeting as any).summary) && meeting.notes && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Meeting Notes</h3>
              <p className="text-sm text-gray-600">{meeting.notes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex gap-3 justify-end">
          <button 
            className="ff-button ff-button-secondary"
            onClick={onClose}
          >
            Close
          </button>
          <button className="ff-button ff-button-primary">
            Edit Meeting
          </button>
        </div>
      </div>
    </div>
  );
}