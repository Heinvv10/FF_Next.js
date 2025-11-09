#!/usr/bin/env python3
"""Check today's messages in WhatsApp SQLite database"""

import sqlite3
from datetime import datetime

# Active database path (from running drop monitor)
DB_PATH = "/home/louisdup/VF/Apps/WA_Tool/whatsapp-mcp/whatsapp-bridge/store/messages.db"

# Group JIDs
GROUPS = {
    'Lawley': '120363418298130331@g.us',
    'Mohadin': '120363421532174586@g.us',
    'Velo Test': '120363421664266245@g.us'
}

print("🔍 Checking SQLite messages.db for today's drops...")
print("=" * 80)

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get today's date
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"📅 Date: {today}\n")

    # Count messages by group today
    for project, jid in GROUPS.items():
        cursor.execute("""
            SELECT COUNT(*)
            FROM messages
            WHERE chat_jid = ?
            AND date(datetime(timestamp/1000, 'unixepoch', 'localtime')) = date('now', 'localtime')
        """, (jid,))

        count = cursor.fetchone()[0]
        print(f"{project}: {count} messages today")

        # Get sample messages with DR numbers
        cursor.execute("""
            SELECT datetime(timestamp/1000, 'unixepoch', 'localtime'), content, sender
            FROM messages
            WHERE chat_jid = ?
            AND date(datetime(timestamp/1000, 'unixepoch', 'localtime')) = date('now', 'localtime')
            AND content LIKE '%DR%'
            ORDER BY timestamp ASC
            LIMIT 5
        """, (jid,))

        dr_messages = cursor.fetchall()
        if dr_messages:
            print(f"   Sample DR messages:")
            for ts, content, sender in dr_messages:
                # Extract just DR number
                import re
                drops = re.findall(r'DR\d+', content, re.IGNORECASE)
                if drops:
                    print(f"   {ts} - {drops[0]} - {sender[:20]}")
        print()

    # Count total drop numbers (DR pattern) today
    cursor.execute("""
        SELECT chat_jid, content, datetime(timestamp/1000, 'unixepoch', 'localtime')
        FROM messages
        WHERE date(datetime(timestamp/1000, 'unixepoch', 'localtime')) = date('now', 'localtime')
        AND content LIKE '%DR%'
        ORDER BY timestamp ASC
    """)

    all_dr_messages = cursor.fetchall()

    # Extract drop numbers by project
    import re
    drop_counts = {project: [] for project in GROUPS.keys()}

    for jid, content, ts in all_dr_messages:
        # Find which project this belongs to
        project = None
        for proj_name, proj_jid in GROUPS.items():
            if jid == proj_jid:
                project = proj_name
                break

        if project:
            drops = re.findall(r'DR\d+', content, re.IGNORECASE)
            for drop in drops:
                drop_counts[project].append(drop.upper())

    print("=" * 80)
    print("📊 DROP NUMBERS DETECTED TODAY:")
    print("=" * 80)
    for project, drops in drop_counts.items():
        unique_drops = list(set(drops))
        print(f"{project}: {len(unique_drops)} unique drop numbers")
        if unique_drops[:5]:
            print(f"   First 5: {', '.join(unique_drops[:5])}")

    cursor.close()
    conn.close()

    print("\n✅ Check complete")

except Exception as e:
    print(f"❌ Error: {e}")
