# LiveKit Meeting Agent
# AI assistant that joins meetings and provides context from previous meetings

from livekit.agents import Agent, AgentSession, RunContext
from livekit.agents.llm import ChatContext, ChatMessage
from livekit.plugins import openai, silero, deepgram
from livekit.agents.voice import VoiceAgent
import os
import asyncio
from db_context import MeetingContextDB

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

class FibreFlowMeetingAgent(VoiceAgent):
    """
    AI Meeting Assistant for FibreFlow
    
    Capabilities:
    - Transcribes speech in real-time
    - Provides context from previous meetings
    - Answers questions about projects and tasks
    - Summarizes discussions
    """
    
    def __init__(self, ctx: RunContext):
        super().__init__(
            ctx=ctx,
            vad=silero.VAD.load(),
            stt=deepgram.STT(),
            llm=openai.LLM(model="gpt-4"),
            tts=openai.TTS(),
            chat_ctx=self._build_initial_context(),
        )
        self.db = MeetingContextDB(DATABASE_URL)
        self.room_name = ctx.room.name
    
    def _build_initial_context(self) -> ChatContext:
        """Build initial chat context with system prompt"""
        ctx = ChatContext()
        ctx.append(
            role="system",
            text="""You are an AI meeting assistant for FibreFlow, a fiber network project management application.

Your role:
1. Listen to the meeting discussion
2. Provide context from previous meetings when relevant
3. Answer questions about projects, tasks, and team members
4. Help summarize key points and action items

Guidelines:
- Be concise and helpful
- Only speak when directly addressed or when you have relevant context to share
- Reference specific past meetings or data when providing context
- If you don't know something, say so clearly

You have access to:
- Previous meeting transcripts and summaries
- Project data and status updates
- Task assignments and deadlines
"""
        )
        return ctx
    
    async def on_participant_joined(self, participant):
        """Greet new participants"""
        if participant.identity != self.ctx.agent.identity:
            await self.say(f"Hello {participant.name}! I'm your AI meeting assistant. Feel free to ask me about previous meetings or project updates.")
    
    async def on_user_speech(self, text: str):
        """Process user speech and respond if relevant"""
        # Check if the user is addressing the agent
        if self._is_addressing_agent(text):
            # Get context from database
            context = await self.db.get_relevant_context(text, self.room_name)
            
            if context:
                # Add context to chat
                self.chat_ctx.append(
                    role="system",
                    text=f"Relevant context from database:\n{context}"
                )
            
            # Generate response
            response = await self.llm.chat(self.chat_ctx)
            await self.say(response.content)
    
    def _is_addressing_agent(self, text: str) -> bool:
        """Check if the user is addressing the AI agent"""
        triggers = [
            "hey assistant",
            "ai",
            "agent",
            "can you",
            "what was",
            "remind me",
            "summarize",
            "previous meeting",
        ]
        text_lower = text.lower()
        return any(trigger in text_lower for trigger in triggers)


async def entrypoint(ctx: RunContext):
    """Entry point for the agent worker"""
    agent = FibreFlowMeetingAgent(ctx)
    await agent.start()
