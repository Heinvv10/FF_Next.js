// LiveKit Module Types
// Ring-fenced module for video meetings

export interface LiveKitRoom {
    name: string;
    title: string;
    createdAt: Date;
    numParticipants: number;
    maxParticipants?: number;
    emptyTimeout?: number;
    metadata?: string;
}

export interface LiveKitParticipant {
    sid: string;
    identity: string;
    name: string;
    state: 'JOINING' | 'JOINED' | 'ACTIVE' | 'DISCONNECTED';
    joinedAt: Date;
    isPublisher: boolean;
    tracks: LiveKitTrack[];
}

export interface LiveKitTrack {
    sid: string;
    type: 'AUDIO' | 'VIDEO' | 'DATA';
    name: string;
    muted: boolean;
}

export interface LiveKitMeeting {
    id: number;
    roomName: string;
    title: string;
    scheduledAt: Date | null;
    startedAt: Date | null;
    endedAt: Date | null;
    recordingPath: string | null;
    createdBy: number | null;
    createdAt: Date;
}

export interface CreateRoomRequest {
    name?: string;
    title: string;
    emptyTimeout?: number;
    maxParticipants?: number;
}

export interface CreateRoomResponse {
    success: boolean;
    room?: LiveKitRoom;
    token?: string;
    error?: string;
}

export interface TokenRequest {
    roomName: string;
    participantName: string;
    participantIdentity?: string;
}

export interface TokenResponse {
    success: boolean;
    token?: string;
    error?: string;
}

export interface RecordingRequest {
    roomName: string;
    action: 'start' | 'stop';
}

export interface RecordingResponse {
    success: boolean;
    egressId?: string;
    recordingPath?: string;
    error?: string;
}

export interface LiveKitWebhookEvent {
    event: string;
    room?: {
        name: string;
        sid: string;
    };
    participant?: {
        sid: string;
        identity: string;
        name: string;
    };
    egressInfo?: {
        egressId: string;
        roomName: string;
        status: string;
        file?: {
            filename: string;
        };
    };
}
