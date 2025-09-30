import { getFirefliesMeetings } from '@/lib/fireflies-sync';
import type { FirefliesMeetingData } from '../types/meeting.types';

export interface FirefliesMeetingResponse {
  id: string;
  title: string;
  created_at: string;
  participants: Array<{ email: string; name?: string }>;
  duration: number;
  full_text?: string;
  summary?: string;
  bullet_points?: string[];
}

export class FirefliesService {
  static async fetchMeetings(limit: number = 50): Promise<FirefliesMeetingResponse[]> {
    try {
      const response = await fetch(`/api/fireflies-meetings?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch meetings');
      }

      return data.meetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        created_at: meeting.created_at,
        participants: meeting.participants || [],
        duration: meeting.duration || 0,
        full_text: meeting.full_text,
        summary: meeting.summary,
        bullet_points: meeting.bullet_points || []
      }));
    } catch (error) {
      console.error('Error fetching Fireflies meetings:', error);
      return [];
    }
  }

  static async syncMeetings(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const response = await fetch('/api/sync-fireflies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync meetings');
      }

      return {
        success: true,
        count: data.synced || 0
      };
    } catch (error) {
      console.error('Error syncing Fireflies meetings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}