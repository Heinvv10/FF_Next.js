// LiveKit Meeting Room Component
// Video conference UI using @livekit/components-react

'use client';

import { useState, useCallback } from 'react';
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    useRoomContext,
    useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    PhoneOff,
    Users,
    Settings,
    Circle,
    Square,
    Bot,
} from 'lucide-react';

interface MeetingRoomProps {
    roomName: string;
    token: string;
    serverUrl: string;
    onDisconnect?: () => void;
}

export function MeetingRoom({ roomName, token, serverUrl, onDisconnect }: MeetingRoomProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [egressId, setEgressId] = useState<string | null>(null);
    const [recordingError, setRecordingError] = useState<string | null>(null);

    const handleStartRecording = async () => {
        try {
            setRecordingError(null);
            const response = await fetch('/api/livekit/recording', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName, action: 'start' }),
            });
            const data = await response.json();

            if (data.success) {
                setIsRecording(true);
                setEgressId(data.egressId);
            } else {
                setRecordingError(data.error);
            }
        } catch (error: any) {
            setRecordingError(error.message);
        }
    };

    const handleStopRecording = async () => {
        if (!egressId) return;

        try {
            setRecordingError(null);
            const response = await fetch('/api/livekit/recording', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName, action: 'stop', egressId }),
            });
            const data = await response.json();

            if (data.success) {
                setIsRecording(false);
                setEgressId(null);
            } else {
                setRecordingError(data.error);
            }
        } catch (error: any) {
            setRecordingError(error.message);
        }
    };

    return (
        <div className="h-screen w-full bg-gray-900">
            <LiveKitRoom
                token={token}
                serverUrl={serverUrl}
                connect={true}
                onDisconnected={onDisconnect}
                data-lk-theme="default"
                style={{ height: '100%' }}
            >
                {/* Main video area */}
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            <h2 className="text-white font-semibold">{roomName}</h2>
                            {isRecording && (
                                <span className="flex items-center gap-1 text-red-500 text-sm animate-pulse">
                                    <Circle className="w-3 h-3 fill-current" />
                                    Recording
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={isRecording ? handleStopRecording : handleStartRecording}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isRecording
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                                    }`}
                            >
                                {isRecording ? (
                                    <>
                                        <Square className="w-4 h-4" />
                                        Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Circle className="w-4 h-4 text-red-500" />
                                        Start Recording
                                    </>
                                )}
                            </button>
                            <ParticipantCount />
                        </div>
                    </div>

                    {/* Video conference */}
                    <div className="flex-1 relative">
                        <VideoConference />
                    </div>

                    {/* Recording error */}
                    {recordingError && (
                        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
                            {recordingError}
                        </div>
                    )}

                    {/* Audio renderer */}
                    <RoomAudioRenderer />
                </div>
            </LiveKitRoom>
        </div>
    );
}

// Participant count component
function ParticipantCount() {
    const participants = useParticipants();

    return (
        <div className="flex items-center gap-1 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{participants.length}</span>
        </div>
    );
}

export default MeetingRoom;
