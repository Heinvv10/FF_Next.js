#!/usr/bin/env python3
"""Drop monitoring logic for WA Monitor - WITH VALIDATION."""

import sqlite3
import re
import logging
import json
import os
import http.client
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

# 🚨 GLOBAL KILL SWITCH - Set to 'false' to disable all WhatsApp auto-reply messages
ENABLE_WHATSAPP_MESSAGES = os.getenv('ENABLE_WHATSAPP_MESSAGES', 'true').lower() == 'true'

class DropMonitor:
    """Monitors WhatsApp messages for drop numbers with validation."""

    DROP_PATTERN = re.compile(r"\bDR\s?\d{6,8}\b", re.IGNORECASE)
    RESUBMISSION_KEYWORDS = ['done', 'updated', 'fixed', 'completed', 'uploaded', 'finish', 'finished']
    EPOCH_START = '1970-01-01 00:00:00+00:00'  # Default start time

    def __init__(self, sqlite_db_path: str, database_manager):
        self.sqlite_db_path = sqlite_db_path
        self.db = database_manager
        self.state_file = Path(__file__).parent.parent / 'state.json'
        self.last_processed_timestamp = self._load_state()

    def _load_state(self) -> Dict:
        """Load last processed timestamps from file (with ID->timestamp migration)."""
        try:
            if self.state_file.exists():
                with open(self.state_file, 'r') as f:
                    state = json.load(f)

                    # Check if state needs migration (ID-based to timestamp-based)
                    migrated = False
                    for group_jid, value in state.items():
                        # If value looks like an ID (hex string, not ISO timestamp)
                        if not self._is_timestamp(value):
                            logger.info(f"🔄 Migrating state for {group_jid} from ID to timestamp")
                            timestamp = self._get_last_timestamp_for_group(group_jid)
                            state[group_jid] = timestamp
                            migrated = True

                    if migrated:
                        # Save migrated state immediately
                        with open(self.state_file, 'w') as f:
                            json.dump(state, f, indent=2)
                        logger.info(f"✅ State migration completed and saved")

                    logger.info(f"📂 Loaded state: {len(state)} groups tracked")
                    return state
        except Exception as e:
            logger.warning(f"⚠️  Could not load state file: {e}")

        return {}

    def _is_timestamp(self, value: str) -> bool:
        """Check if value is a timestamp (not an ID)."""
        # Timestamps contain colons and dashes, IDs are hex strings
        return ':' in value and '-' in value

    def _get_last_timestamp_for_group(self, group_jid: str) -> str:
        """Get the last message timestamp for a group from SQLite."""
        try:
            conn = sqlite3.connect(self.sqlite_db_path)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT timestamp FROM messages WHERE chat_jid = ? ORDER BY timestamp DESC LIMIT 1",
                (group_jid,)
            )
            result = cursor.fetchone()
            cursor.close()
            conn.close()

            if result:
                logger.info(f"   Found last timestamp: {result[0]}")
                return result[0]
            else:
                logger.info(f"   No messages found, using epoch start")
                return self.EPOCH_START
        except Exception as e:
            logger.error(f"❌ Error getting last timestamp for {group_jid}: {e}")
            return self.EPOCH_START

    def _save_state(self):
        """Save last processed timestamps to file."""
        try:
            with open(self.state_file, 'w') as f:
                json.dump(self.last_processed_timestamp, f, indent=2)
        except Exception as e:
            logger.error(f"❌ Could not save state file: {e}")

    def get_new_messages(self, group_jid: str) -> List[Dict]:
        """Get new messages from WhatsApp SQLite database (timestamp-based)."""
        try:
            conn = sqlite3.connect(self.sqlite_db_path)
            cursor = conn.cursor()

            # Get last processed timestamp for this group (default to epoch if not set)
            last_timestamp = self.last_processed_timestamp.get(group_jid, self.EPOCH_START)

            # Query by timestamp (chronological!) with ID as tiebreaker
            # FILTER OUT bot's own messages to prevent infinite loops
            # Bot phone numbers: 27640412391 (bridge), 27711558396 (sender)
            query = """
            SELECT id, sender, content, timestamp
            FROM messages
            WHERE chat_jid = ?
              AND timestamp > ?
              AND sender NOT IN ('27640412391', '27711558396', '36563643842564', '10892708159649')
            ORDER BY timestamp ASC, id ASC
            """

            cursor.execute(query, (group_jid, last_timestamp))
            messages = cursor.fetchall()

            cursor.close()
            conn.close()

            return [
                {
                    'id': msg[0],
                    'sender': msg[1],
                    'content': msg[2],
                    'timestamp': msg[3]
                }
                for msg in messages
            ]

        except Exception as e:
            logger.error(f"Error reading WhatsApp DB: {e}")
            return []

    def extract_drop_number(self, content: str) -> Optional[str]:
        """Extract drop number from message content."""
        if not content:
            return None

        match = self.DROP_PATTERN.search(content)
        return match.group(0).upper().replace(" ", "") if match else None

    def validate_drop_number(self, drop_number: str, project_name: str) -> bool:
        """Validate drop number against valid_drop_numbers table."""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()

            cursor.execute(
                "SELECT 1 FROM valid_drop_numbers WHERE drop_number = %s AND project = %s LIMIT 1",
                (drop_number, project_name)
            )

            is_valid = cursor.fetchone() is not None

            cursor.close()
            conn.close()

            return is_valid

        except Exception as e:
            logger.error(f"❌ Error validating drop number: {e}")
            # On error, allow drop through (fail open to avoid data loss)
            return True

    def log_invalid_drop(self, drop_number: str, project_name: str, sender: str, group_jid: str):
        """Log invalid drop to database for tracking."""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()

            # Create table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS invalid_drop_submissions (
                    id SERIAL PRIMARY KEY,
                    drop_number VARCHAR(20),
                    project VARCHAR(100),
                    sender VARCHAR(50),
                    group_jid VARCHAR(100),
                    submitted_at TIMESTAMP DEFAULT NOW(),
                    reason VARCHAR(100) DEFAULT 'not_in_valid_list'
                )
            """)

            # Insert rejection
            cursor.execute("""
                INSERT INTO invalid_drop_submissions (drop_number, project, sender, group_jid, reason)
                VALUES (%s, %s, %s, %s, 'not_in_valid_list')
            """, (drop_number, project_name, sender, group_jid))

            conn.commit()
            cursor.close()
            conn.close()

            logger.warning(f"🚫 REJECTED: {drop_number} (not in valid list for {project_name})")

        except Exception as e:
            logger.error(f"❌ Error logging invalid drop: {e}")

    def send_whatsapp_direct_message(self, group_jid: str, recipient_phone: str, message: str) -> bool:
        """Send direct WhatsApp message with @mention via Sender API (port 8081) with fallback."""

        # 🚨 KILL SWITCH CHECK
        if not ENABLE_WHATSAPP_MESSAGES:
            logger.warning(f"🚫 Message NOT sent (kill switch active): {message[:50]}...")
            return True  # Return True so processing continues

        # Try Sender API first (port 8081 - with @mentions)
        try:
            recipient_jid = f"{recipient_phone}@s.whatsapp.net"
            conn = http.client.HTTPConnection("localhost", 8081, timeout=5)

            payload = json.dumps({
                "group_jid": group_jid,
                "recipient_jid": recipient_jid,
                "message": message
            })

            headers = {'Content-Type': 'application/json'}
            conn.request("POST", "/send-message", payload, headers)
            response = conn.getresponse()
            data = response.read()
            conn.close()

            if response.status == 200:
                logger.info(f"✅ Direct message (8081) sent to {recipient_phone}")
                return True
            else:
                logger.warning(f"⚠️  Sender API (8081) failed: {response.status}, trying fallback...")
        except Exception as e:
            logger.warning(f"⚠️  Sender API (8081) error: {e}, trying fallback...")

        # Fallback to Bridge API (port 8080 - group message, no @mention)
        try:
            conn = http.client.HTTPConnection("localhost", 8080, timeout=5)

            payload = json.dumps({
                "recipient": group_jid,
                "message": message
            })

            headers = {'Content-Type': 'application/json'}
            conn.request("POST", "/api/send", payload, headers)
            response = conn.getresponse()
            data = response.read()
            conn.close()

            if response.status == 200:
                logger.info(f"✅ Group message (8080 fallback) sent to {group_jid}")
                return True
            else:
                logger.error(f"❌ Both APIs failed. Bridge (8080): {response.status}")
                return False

        except Exception as e:
            logger.error(f"❌ Both APIs failed. Bridge error: {e}")
            return False

    def resolve_sender_to_phone(self, sender: str) -> str:
        """Resolve sender (ALWAYS check LID map - LIDs can be all digits too!)."""
        try:
            whatsapp_db_path = str(Path(self.sqlite_db_path).parent / 'whatsapp.db')
            conn = sqlite3.connect(whatsapp_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT pn FROM whatsmeow_lid_map WHERE lid = ?", (sender,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            if result:
                phone_number = result[0]
                logger.info(f"🔗 Resolved LID {sender} → {phone_number}")
                return phone_number
            else:
                # Not in LID map - assume it's already a phone number
                logger.debug(f"No LID mapping for {sender}, using as-is")
                return sender
        except Exception as e:
            logger.error(f"❌ Error resolving LID {sender}: {e}")
            return sender

    def has_resubmission_keyword(self, content: str) -> bool:
        """Check if message contains resubmission keywords."""
        if not content:
            return False
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in self.RESUBMISSION_KEYWORDS)

    def process_message(self, message: Dict, project_name: str, group_jid: str) -> bool:
        """Process a single message for drop numbers with validation."""
        drop_number = self.extract_drop_number(message['content'])

        if not drop_number:
            return False

        logger.info(f"📱 Found drop: {drop_number} in {project_name}")

        # ✅ VALIDATION CHECK - MOHADIN, LAWLEY & MAMELODI (other projects pass through)
        if project_name in ['Mohadin', 'Lawley', 'Mamelodi']:
            if not self.validate_drop_number(drop_number, project_name):
                logger.warning(f"❌ INVALID DROP: {drop_number} not in valid list for {project_name}")
                self.log_invalid_drop(drop_number, project_name, message['sender'], group_jid)

                # Resolve sender to phone number (resolve LIDs)
                sender_phone = self.resolve_sender_to_phone(message['sender'])

                # Send direct WhatsApp message with @mention
                reply_message = (
                    f"❌ Invalid Drop Number\n\n"
                    f"Drop {drop_number} is not in the valid list for {project_name}.\n\n"
                    f"Please submit a valid drop number from the project plan."
                )
                self.send_whatsapp_direct_message(group_jid, sender_phone, reply_message)

                return False
            logger.info(f"✅ VALIDATED: {drop_number} is valid for {project_name}")
        else:
            logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test passes through)")

        # Resolve sender to actual phone number (handles LIDs from linked devices)
        resolved_phone = self.resolve_sender_to_phone(message['sender'])

        # Check if message contains resubmission keywords (Done, Updated, etc.)
        has_keyword = self.has_resubmission_keyword(message['content'])

        # Check if drop already exists
        if self.db.check_drop_exists(drop_number):
            if has_keyword:
                logger.info(f"🔄 Resubmission with keyword detected: {drop_number}")
            else:
                logger.info(f"🔄 Resubmission detected: {drop_number}")
            return self.db.handle_resubmission(drop_number, project_name, resolved_phone)
        else:
            # New drop - insert
            drop_data = {
                'drop_number': drop_number,
                'user_name': resolved_phone[:100],
                'submitted_by': resolved_phone,
                'project': project_name,
                'message_timestamp': message['timestamp'],
                'comment': f"Created from WhatsApp message (validated)"
            }
            return self.db.insert_drop(drop_data)

    def scan_project(self, project: Dict) -> int:
        """Scan a single project for new drops."""
        messages = self.get_new_messages(project['group_jid'])

        if not messages:
            return 0

        processed_count = 0

        for message in messages:
            if self.process_message(message, project['name'], project['group_jid']):
                processed_count += 1

            # Update last processed TIMESTAMP for this group (even if rejected)
            self.last_processed_timestamp[project['group_jid']] = message['timestamp']

        # Save state after processing messages (always, even if all rejected)
        if len(messages) > 0:
            self._save_state()

        return processed_count
