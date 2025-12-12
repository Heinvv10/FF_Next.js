# Database Context Service
# Queries previous meetings and project data for the AI agent

import asyncio
import psycopg2
from typing import Optional, List, Dict
import os

class MeetingContextDB:
    """
    Provides context from the database for the AI meeting agent
    """
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.conn = None
    
    def _get_connection(self):
        """Get or create database connection"""
        if self.conn is None or self.conn.closed:
            self.conn = psycopg2.connect(self.database_url)
        return self.conn
    
    async def get_relevant_context(self, query: str, current_room: str) -> Optional[str]:
        """
        Get relevant context based on the user's query
        
        Args:
            query: The user's question or statement
            current_room: The current meeting room name
            
        Returns:
            Formatted context string or None
        """
        context_parts = []
        
        # Get previous meetings (from Fireflies integration)
        previous_meetings = await self._get_previous_meetings(5)
        if previous_meetings:
            context_parts.append("## Previous Meetings\n" + self._format_meetings(previous_meetings))
        
        # Get LiveKit meetings history
        livekit_meetings = await self._get_livekit_meetings(5)
        if livekit_meetings:
            context_parts.append("## LiveKit Meetings\n" + self._format_livekit_meetings(livekit_meetings))
        
        # Get project data if query mentions projects
        if any(word in query.lower() for word in ['project', 'status', 'progress', 'update']):
            projects = await self._get_recent_projects()
            if projects:
                context_parts.append("## Recent Projects\n" + self._format_projects(projects))
        
        return "\n\n".join(context_parts) if context_parts else None
    
    async def _get_previous_meetings(self, limit: int = 5) -> List[Dict]:
        """Get previous meetings from Fireflies integration"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT title, meeting_date, summary, participants
                FROM meetings
                ORDER BY meeting_date DESC
                LIMIT %s
            """, (limit,))
            
            columns = ['title', 'meeting_date', 'summary', 'participants']
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching previous meetings: {e}")
            return []
    
    async def _get_livekit_meetings(self, limit: int = 5) -> List[Dict]:
        """Get previous LiveKit meetings"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT room_name, title, started_at, ended_at, recording_path
                FROM livekit_meetings
                WHERE ended_at IS NOT NULL
                ORDER BY started_at DESC
                LIMIT %s
            """, (limit,))
            
            columns = ['room_name', 'title', 'started_at', 'ended_at', 'recording_path']
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching LiveKit meetings: {e}")
            return []
    
    async def _get_recent_projects(self, limit: int = 10) -> List[Dict]:
        """Get recent projects"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT name, status, progress, updated_at
                FROM projects
                ORDER BY updated_at DESC
                LIMIT %s
            """, (limit,))
            
            columns = ['name', 'status', 'progress', 'updated_at']
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching projects: {e}")
            return []
    
    def _format_meetings(self, meetings: List[Dict]) -> str:
        """Format meetings for context"""
        lines = []
        for m in meetings:
            title = m.get('title', 'Untitled')
            date = m.get('meeting_date', 'Unknown date')
            summary = m.get('summary', {})
            if isinstance(summary, dict):
                summary_text = summary.get('short_hand_bullet', 'No summary')
            else:
                summary_text = str(summary)[:200]
            lines.append(f"- **{title}** ({date}): {summary_text}")
        return "\n".join(lines)
    
    def _format_livekit_meetings(self, meetings: List[Dict]) -> str:
        """Format LiveKit meetings for context"""
        lines = []
        for m in meetings:
            title = m.get('title', m.get('room_name', 'Untitled'))
            started = m.get('started_at', 'Unknown')
            has_recording = "📹" if m.get('recording_path') else ""
            lines.append(f"- **{title}** ({started}) {has_recording}")
        return "\n".join(lines)
    
    def _format_projects(self, projects: List[Dict]) -> str:
        """Format projects for context"""
        lines = []
        for p in projects:
            name = p.get('name', 'Unknown')
            status = p.get('status', 'Unknown')
            progress = p.get('progress', 0)
            lines.append(f"- **{name}**: {status} ({progress}% complete)")
        return "\n".join(lines)
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
