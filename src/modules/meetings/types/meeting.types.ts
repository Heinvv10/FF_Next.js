export interface Meeting {
  id: string;
  title: string;
  type: 'team' | 'client' | 'board' | 'standup' | 'review';
  date: Date;
  time: string;
  duration: string;
  location: string;
  isVirtual: boolean;
  meetingLink?: string;
  organizer: string;
  participants: string[];
  agenda: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  actionItems: ActionItem[];
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  dueDate: Date;
  completed: boolean;
  meetingId: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface UpcomingMeeting {
  id: string;
  title: string;
  time: string;
  type: string;
  participants: number;
}

// Fireflies specific types
export interface FirefliesMeetingData {
  id: string;
  title: string;
  created_at: string;
  participants: Array<{ email: string; name?: string }>;
  duration: number;
  transcript?: string;
  summary?: {
    overview: string;
    bullet_points: string[];
  };
  fireflies_id: string;
}