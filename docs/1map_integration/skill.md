# 1Map GIS Integration Skill

## Overview
This skill provides integration with 1Map GIS API for accessing Fibertime installation data, including DR records, photos, and site information.

## When to Use
- User asks about DR (Drop) records
- User wants to download installation photos
- **User wants to upload photos to a DR record (NEW)**
- User needs to verify installations
- User asks about Fibertime sites/projects
- User wants to check DR status

## Agent Location
`agents/integrations/onemap_specialist_agent.py`

## CRITICAL: Multiple Property IDs per DR

### Understanding the Data Model

| Concept | Description | Example |
|---------|-------------|---------|
| **DR Number** | Unique ID for the physical location/customer | `DR1733592` |
| **Property ID** | Transaction ID - created for each action/stage | `391251`, `391252` |

**A single DR number can have MULTIPLE Property IDs** because each stage of the installation process creates a new transaction:

1. **Signup Stage** → New Property ID created with signup photos
2. **Pole Permission Stage** → New Property ID created with pole photos
3. **Installation Stage** → New Property ID created with installation photos
4. **Completion Stage** → New Property ID created with final photos

### Example: One DR with Multiple Transactions
```
DR1733592 (UID - the physical location/customer)
│
├── Property ID 391251 (Transaction: "Home Sign Ups: Approved")
│   ├── ph_prop (property photo taken at signup)
│   ├── ph_sign1 (customer signature)
│   └── ph_wall (wall mount location)
│
├── Property ID 391252 (Transaction: "Pole Permission: Approved")
│   ├── ph_sign3 (pole permission signature)
│   └── ph_drop (drop cable route)
│
└── Property ID 391253 (Transaction: "Home Installation: Installed")
    ├── ph_powm1 (power meter before)
    ├── ph_powm2 (power meter after)
    ├── ph_after (completed installation)
    └── ph_hm_en (home entry point)
```

**To get the COMPLETE picture of an installation, you MUST collect photos from ALL Property IDs.**

The agent automatically handles this - `get_dr()` fetches ALL transactions, and `download_all_photos()` downloads from EACH Property ID.

### Correct Download Flow
```python
# get_dr() automatically fetches ALL Property IDs
record = await agent.get_dr("DR1733592")

# Shows all Property IDs
print(f"Found {len(record.property_records)} Property IDs:")
for pr in record.property_records:
    print(f"  - {pr.primary_id}: {pr.status} ({len(pr.photos)} photos)")

# download_all_photos() downloads from EACH Property ID
photos = await agent.download_all_photos(record, output_dir="photos/DR1733592")
```

## Quick Reference

### Environment Variables
```bash
ONEMAP_EMAIL=hein@velocityfibre.co.za
ONEMAP_PASSWORD=VeloF@2025
```

### CLI Commands
```bash
# Get DR info (shows all Property IDs)
python agents/integrations/onemap_specialist_agent.py get --dr DR1733592

# Download photos (from ALL Property IDs)
python agents/integrations/onemap_specialist_agent.py photos --dr DR1733592 --output photos/DR1733592

# Upload photo to DR (uploads to most recent Property ID)
python agents/integrations/onemap_specialist_agent.py upload --dr DR1733592 --photo /path/to/photo.jpg --type ph_test

# Search by site
python agents/integrations/onemap_specialist_agent.py search --site LAW --limit 50

# Verify photos (checks all Property IDs)
python agents/integrations/onemap_specialist_agent.py verify --dr DR1733592

# List known sites
python agents/integrations/onemap_specialist_agent.py sites
```

### Programmatic Usage
```python
from agents.integrations.onemap_specialist_agent import OneMapSpecialistAgent

async with OneMapSpecialistAgent(
    email="hein@velocityfibre.co.za",
    password="VeloF@2025"
) as agent:
    # Get DR record (includes ALL Property IDs)
    record = await agent.get_dr("DR1733592")

    # Access individual Property IDs
    for prop in record.property_records:
        print(f"Property ID: {prop.primary_id}, Status: {prop.status}")
        print(f"  Photos: {list(prop.photos.keys())}")

    # Download all photos (from ALL Property IDs)
    photos = await agent.download_all_photos(record, output_dir="photos/DR1733592")

    # Upload photo to DR (automatically finds most recent Property ID)
    result = await agent.upload_dr_photo(
        dr_number="DR1733592",
        photo_path="/path/to/photo.jpg",
        photo_type="ph_test"  # or ph_prop, ph_after, etc.
    )

    # Upload to specific Property ID (advanced usage)
    result = await agent.upload_photo(
        layer_id="5121",
        property_id=391251,
        photo_path="/path/to/photo.jpg",
        field_name="ph_test"
    )

    # Get attachment metadata for specific Property ID
    for prop in record.property_records:
        metadata = await agent.get_attachments_metadata(prop.primary_id)
```

## API Knowledge

### Layer ID
- **Fibertime Installations**: `5121`

### Key Fields
- `drp` - DR number (e.g., "DR1733592")
- `site` - Site code (e.g., "LAW", "KWN")
- `status` - Installation status
- `address` - Installation address
- `prop_id` - Property ID (primary_id)

### Photo Types (16 total)
| Field | Description |
|-------|-------------|
| `ph_prop` | Property photo |
| `ph_sign1` | Customer signature 1 |
| `ph_sign2` | Customer signature 2 |
| `ph_wall` | Wall mount photo |
| `ph_powm1` | Power meter reading 1 |
| `ph_powm2` | Power meter reading 2 |
| `ph_drop` | Drop cable photo |
| `ph_conn1` | Connection photo 1 |
| `ph_hh1` | House/Home photo 1 |
| `ph_hh2` | House/Home photo 2 |
| `ph_hm_ln` | Home line photo |
| `ph_hm_en` | Home entrance photo |
| `ph_outs` | Outside photo |
| `ph_cbl_r` | Cable routing photo |
| `ph_bl` | Building photo |
| `ph_after` | After installation photo |

### Known Sites
| Code | Name |
|------|------|
| LAW | Lawley |
| KWN | KwaNobuhle |
| KWM | KwaMashu |
| DAV | Davidsonville |
| SOW | Soweto |
| THO | Thokoza |
| KAT | Katlehong |
| VOO | Vosloorus |
| TEM | Tembisa |
| ALE | Alexandra |
| EKU | eKurhuleni |
| JHB | Johannesburg |
| PTA | Pretoria |
| DBN | Durban |
| CT | Cape Town |

### Filtering
Use `CQL_FILTER` parameter (NOT `where`):
```python
params = {
    "CQL_FILTER": f"drp='{dr_number}'"
}
```

### Attachment Endpoints
```
GET  /attachments/{layerId}/{primaryId}                          - Get attachment metadata
GET  /attachments/file/{layerId}/{primaryId}/{attachmentId}      - Download file
POST /apps/app/attachments/upload                                - Upload file (NEW)
```

**Upload Parameters:**
- `layer_id` - Layer ID (e.g., "5121")
- `property_id` - Property ID (transaction ID)
- `field_name` - Photo type field (e.g., "ph_test", "ph_prop")
- `token` - Authentication token
- `file` - Multipart file upload

## Integration with BOSS

### Download Workflow
1. User requests DR verification
2. Agent fetches DR record from 1Map
3. Agent downloads installation photos
4. Photos stored locally or in Nextcloud
5. User reviews photos for verification

### Upload Workflow (NEW)
1. User provides photo to upload (or DR Photo Verification Agent captures it)
2. Agent authenticates with 1Map
3. Agent looks up DR record to find most recent Property ID
4. Agent uploads photo to the Property ID with specified field name
5. Photo becomes available immediately in 1Map web interface
6. Can be downloaded/verified through normal photo verification flow

**Automatic Upload Triggers:**
- DR Photo Verification Agent finds missing required photos
- User manually requests upload via CLI or API
- Integration with external photo capture systems
- Automated quality assurance workflows

### Error Handling
- Authentication errors (2-hour token validity)
- Site access restrictions (allowed_sites parameter)
- Missing DR records
- Photo download failures
- **Upload failures** (file not found, invalid property ID, network errors)
- **File validation** (size limits, format checks)

## Cost
- **Free** - 1Map API included with Fibertime enterprise subscription
