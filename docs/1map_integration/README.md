# 1Map GIS Integration Package

Transfer package for 1Map GIS API integration.

## Contents

| File | Description |
|------|-------------|
| `skill.md` | Skill documentation for Claude Code integration |
| `onemap_client.py` | Working API client with session-based auth |
| `inspect_onemap_fields.py` | Utility to inspect API response structure |

## Environment Variables

```bash
ONEMAP_EMAIL=your_email@example.com
ONEMAP_PASSWORD=your_password
```

## Quick Start

```python
from onemap_client import OneMapClient
import asyncio

async def main():
    async with OneMapClient(
        email="your_email@example.com",
        password="your_password"
    ) as client:
        # Search installations
        result = await client.search_installations("lawley", limit=10)

        # Get specific DR
        dr_record = await client.get_dr("DR1734472")

        # Get all installations for a site
        all_records = await client.get_all_installations("lawley", max_pages=2)

asyncio.run(main())
```

## API Reference

### Authentication
- **Method**: Session-based (cookies: `connect.sid`, `csrfToken`)
- **Endpoint**: `POST https://www.1map.co.za/login`

### Main Endpoint
- **URL**: `POST https://www.1map.co.za/api/apps/app/getattributes`
- **Layer ID**: `5121` (Fibertime Installations)

### Key Fields
| Field | Description |
|-------|-------------|
| `drp` | DR number (unique ID) |
| `pole` | Pole number |
| `site` | Site code (LAW, KWN, etc.) |
| `status` | Installation status |
| `latitude` / `longitude` | GPS coordinates |
| `address` | Installation address |
| `ph_*` | Photo fields (16 types) |

## Dependencies

```bash
pip install httpx python-dotenv
```

## Notes

- Session cookies expire after ~2 hours
- Pagination: 50 records per page max
- Layer 5121 = Fibertime Installations
- Layer 5198 = Poles
