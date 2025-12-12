# LiveKit Agent Entry Point
# Worker process that dispatches agents to meetings

from livekit.agents import Worker, WorkerOptions, JobType
from meeting_agent import entrypoint
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Main entry point for the agent worker"""
    
    worker = Worker(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            job_type=JobType.JT_ROOM,
        ),
        api_key=os.getenv("LIVEKIT_API_KEY"),
        api_secret=os.getenv("LIVEKIT_API_SECRET"),
        ws_url=os.getenv("LIVEKIT_URL"),
    )
    
    worker.run()


if __name__ == "__main__":
    main()
