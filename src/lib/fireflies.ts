import { request, gql } from 'graphql-request';

const API_URL = 'https://api.fireflies.ai/graphql';
const API_KEY = process.env.FIREFLIES_API_KEY!;

export interface FirefliesMeeting {
  id: string;
  title: string;
  date: number; // timestamp
  duration: number;
  participants: string[];
  transcript_url?: string;
  summary: {
    overview: string;
    bullet_gist: string;
  };
}

export async function fetchFirefliesMeetings(): Promise<FirefliesMeeting[]> {
  const query = gql`
    query GetTranscripts {
      transcripts(limit: 50) {
        id
        title
        date
        duration
        participants
        transcript_url
        summary {
          overview
          bullet_gist
        }
      }
    }
  `;

  try {
    const data = await request<{ transcripts: FirefliesMeeting[] }>(
      API_URL,
      query,
      {},
      { Authorization: `Bearer ${API_KEY}` }
    );

    return data.transcripts;
  } catch (error) {
    console.error('Error fetching Fireflies meetings:', error);
    throw error;
  }
}

export async function fetchFirefliesMeetingById(meetingId: string): Promise<FirefliesMeeting | null> {
  const query = gql`
    query GetTranscript($id: ID!) {
      transcript(id: $id) {
        id
        title
        date
        duration
        participants
        transcript_url
        summary {
          overview
          bullet_gist
        }
      }
    }
  `;

  try {
    const data = await request<{ transcript: FirefliesMeeting }>(
      API_URL,
      query,
      { id: meetingId },
      { Authorization: `Bearer ${API_KEY}` }
    );

    return data.transcript;
  } catch (error) {
    console.error(`Error fetching Fireflies meeting ${meetingId}:`, error);
    throw error;
  }
}